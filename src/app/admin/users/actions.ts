"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { adminEmails } from "@/lib/env";
import { requireAdminAction } from "@/lib/session";

type R = { ok: boolean; message: string };
const id = z.string().min(1).max(128);

async function target(adminId: string, userId: string) {
  if (userId === adminId) throw new Error("You cannot do this to your own account.");
  const [u] = await db.select().from(schema.user).where(eq(schema.user.id, userId));
  if (!u) throw new Error("User not found.");
  if (u.role !== "user" || adminEmails.includes(u.email.toLowerCase())) throw new Error("Admin accounts cannot be changed here.");
  return u;
}
const fail = (e: unknown): R => ({ ok: false, message: e instanceof Error ? e.message : "Something went wrong." });

export async function setSuspended(userId: string, suspended: boolean): Promise<R> {
  try {
    const admin = await requireAdminAction();
    const u = await target(admin.user.id, id.parse(userId));
    await db.update(schema.user).set({ banned: suspended, updatedAt: new Date() }).where(eq(schema.user.id, u.id));
    if (suspended) await db.delete(schema.session).where(eq(schema.session.userId, u.id)); // sign them out everywhere
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: suspended ? "user.suspend" : "user.reactivate", target: u.email });
    revalidatePath("/admin/users");
    return { ok: true, message: suspended ? "Suspended and signed out." : "Reactivated." };
  } catch (e) { return fail(e); }
}

/** Permanently deletes the account and everything linked to it (CV, applications, drafts, roadmap, matches). */
export async function deleteUser(userId: string): Promise<R> {
  try {
    const admin = await requireAdminAction();
    const u = await target(admin.user.id, id.parse(userId));
    await db.delete(schema.user).where(eq(schema.user.id, u.id));
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: "user.delete", target: u.email });
    revalidatePath("/admin/users");
    return { ok: true, message: "Account deleted." };
  } catch (e) { return fail(e); }
}
