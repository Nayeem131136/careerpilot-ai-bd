import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { adminEmails, features } from "@/lib/env";

const rawSession = cache(async () => {
  try {
    return await getAuth().api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
});

const isSuspended = cache(async (userId: string) => {
  const [row] = await db.select({ banned: schema.user.banned }).from(schema.user).where(eq(schema.user.id, userId));
  return !row || row.banned;
});

/** Returns the current session or null (also null for suspended accounts). Never throws for "not configured". */
export async function getSession() {
  const s = await rawSession();
  if (!s) return null;
  try {
    return (await isSuspended(s.user.id)) ? null : s;
  } catch {
    return null;
  }
}

/** Data Access Layer guard: use in every protected server component / route. */
export async function requireSession() {
  const s = await rawSession();
  if (!s) redirect("/login");
  if (await isSuspended(s.user.id)) redirect("/login?suspended=1");
  return s;
}

type SessionUser = { id: string; email: string; role?: string | null; emailVerified?: boolean };

/**
 * Admin check that reads the role from the database (not the cached session) and
 * promotes emails listed in ADMIN_EMAILS. When email verification is enforced
 * (Resend configured), the address must be verified first.
 */
const isAdminById = cache(async (id: string, email: string): Promise<boolean> => {
  const [row] = await db.select({ role: schema.user.role, verified: schema.user.emailVerified }).from(schema.user).where(eq(schema.user.id, id));
  if (!row) return false;
  if (row.role === "admin" || row.role === "super_admin") return true;
  if (adminEmails.includes(email.toLowerCase()) && (!features.email || row.verified)) {
    await db.update(schema.user).set({ role: "admin" }).where(eq(schema.user.id, id));
    await db.insert(schema.auditLogs).values({ actorId: id, action: "admin.promoted_by_env", target: id });
    return true;
  }
  return false;
});
export async function resolveIsAdmin(u: SessionUser): Promise<boolean> {
  return isAdminById(u.id, u.email);
}

export async function requireAdmin() {
  const s = await requireSession();
  if (!(await resolveIsAdmin(s.user))) redirect("/dashboard");
  return s;
}

/** For server actions: throws instead of redirecting. */
export async function requireAdminAction() {
  const s = await getSession();
  if (!s || !(await resolveIsAdmin(s.user))) throw new Error("Not authorised.");
  return s;
}
