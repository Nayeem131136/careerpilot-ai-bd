import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { adminEmails, features } from "@/lib/env";

/** Returns the current session or null. Never throws for "not configured". */
export async function getSession() {
  try {
    return await getAuth().api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

/** Data Access Layer guard: use in every protected server component / route. */
export async function requireSession() {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

type SessionUser = { id: string; email: string; role?: string | null; emailVerified?: boolean };

/**
 * Admin check that reads the role from the database (not the cached session) and
 * promotes emails listed in ADMIN_EMAILS. When email verification is enforced
 * (Resend configured), the address must be verified first.
 */
export async function resolveIsAdmin(u: SessionUser): Promise<boolean> {
  const [row] = await db.select({ role: schema.user.role, verified: schema.user.emailVerified }).from(schema.user).where(eq(schema.user.id, u.id));
  if (!row) return false;
  if (row.role === "admin" || row.role === "super_admin") return true;
  if (adminEmails.includes(u.email.toLowerCase()) && (!features.email || row.verified)) {
    await db.update(schema.user).set({ role: "admin" }).where(eq(schema.user.id, u.id));
    await db.insert(schema.auditLogs).values({ actorId: u.id, action: "admin.promoted_by_env", target: u.id });
    return true;
  }
  return false;
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
