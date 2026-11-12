"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdminAction } from "@/lib/session";

const ok = (message: string) => { revalidatePath("/admin/errors"); revalidatePath("/admin"); return { ok: true, message }; };
const fail = (e: unknown) => ({ ok: false, message: e instanceof Error ? e.message : "Something went wrong." });

export async function setErrorStatus(id: string, status: "open" | "resolved") {
  try { await requireAdminAction(); await db.update(schema.errorLogs).set({ status }).where(eq(schema.errorLogs.id, z.string().uuid().parse(id))); return ok("Updated."); } catch (e) { return fail(e); }
}
export async function deleteError(id: string) {
  try { await requireAdminAction(); await db.delete(schema.errorLogs).where(eq(schema.errorLogs.id, z.string().uuid().parse(id))); return ok("Deleted."); } catch (e) { return fail(e); }
}
export async function clearResolved() {
  try { await requireAdminAction(); const r = await db.delete(schema.errorLogs).where(eq(schema.errorLogs.status, "resolved")).returning({ id: schema.errorLogs.id }); return ok(`${r.length} cleared.`); } catch (e) { return fail(e); }
}
