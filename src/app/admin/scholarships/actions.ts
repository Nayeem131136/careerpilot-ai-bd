"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { recheckScholarships, verifyNow } from "@/lib/scholarships/check";
import { extractScholarship } from "@/lib/scholarships/extract";
import { SEED } from "@/lib/scholarships/seed";
import { scholarshipInput, type ScholarshipInput } from "@/lib/scholarships/types";
import { requireAdminAction } from "@/lib/session";

type R = { ok: boolean; message: string; id?: string };
const uuid = z.string().uuid();
const done = (message: string, id?: string): R => { revalidatePath("/admin/scholarships"); revalidatePath("/dashboard/scholarships"); return { ok: true, message, id }; };
const fail = (e: unknown): R => ({ ok: false, message: e instanceof Error ? e.message : "Something went wrong." });
const audit = (actorId: string, action: string, target: string) => db.insert(schema.auditLogs).values({ actorId, action, target });
const dateOf = (s: string) => (s ? new Date(`${s}T00:00:00Z`) : null);
const row = (d: ScholarshipInput) => ({ ...d, deadlineDate: dateOf(d.deadlineDate ?? ""), updatedAt: new Date() });

/** Loads the starter list as "pending" (never shown to users until an admin publishes). */
export async function loadStarterList(): Promise<R> {
  try {
    const admin = await requireAdminAction();
    const res = await db.insert(schema.scholarships).values(SEED.map((s) => ({ ...row(s), status: "pending", origin: "seed" }))).onConflictDoNothing().returning({ id: schema.scholarships.id });
    await audit(admin.user.id, "scholarships.seed", String(res.length));
    return done(res.length ? `${res.length} programmes added to the review queue.` : "The starter list is already loaded.");
  } catch (e) { return fail(e); }
}

export async function saveScholarship(id: string | null, input: unknown): Promise<R> {
  try {
    const admin = await requireAdminAction();
    const d = scholarshipInput.safeParse(input);
    if (!d.success) return { ok: false, message: d.error.issues[0]?.message ?? "Invalid input." };
    if (id) {
      uuid.parse(id);
      await db.update(schema.scholarships).set(row(d.data)).where(eq(schema.scholarships.id, id));
      await audit(admin.user.id, "scholarships.edit", id);
      return done("Saved.", id);
    }
    const [r] = await db.insert(schema.scholarships).values({ ...row(d.data), status: "pending", origin: "manual" }).returning({ id: schema.scholarships.id });
    await audit(admin.user.id, "scholarships.add", r.id);
    return done("Added to the review queue.", r.id);
  } catch (e) {
    return { ok: false, message: e instanceof Error && /unique|duplicate/i.test(e.message) ? "A scholarship with this official link already exists." : "Could not save." };
  }
}

export async function addFromUrl(url: string): Promise<R> {
  try {
    const admin = await requireAdminAction();
    const x = await extractScholarship(String(url).trim(), admin.user.id);
    if (!x.ok) return { ok: false, message: x.message };
    const [r] = await db.insert(schema.scholarships).values({ ...row(x.data), status: "pending", origin: "ai" }).onConflictDoNothing().returning({ id: schema.scholarships.id });
    if (!r) return { ok: false, message: "A scholarship with this official link already exists." };
    await audit(admin.user.id, "scholarships.ai_add", r.id);
    return done("Read the page and added it to the review queue. Open it, check every field against the page, then publish.", r.id);
  } catch (e) { return fail(e); }
}

export async function setStatus(id: string, status: "published" | "pending" | "archived"): Promise<R> {
  try {
    const admin = await requireAdminAction();
    z.enum(["published", "pending", "archived"]).parse(status);
    await db.update(schema.scholarships).set({ status, updatedAt: new Date() }).where(eq(schema.scholarships.id, uuid.parse(id)));
    await audit(admin.user.id, `scholarships.${status}`, id);
    return done(status === "published" ? "Published." : "Updated.");
  } catch (e) { return fail(e); }
}

export async function publishAllPending(): Promise<R> {
  try {
    const admin = await requireAdminAction();
    const res = await db.update(schema.scholarships).set({ status: "published", updatedAt: new Date() }).where(eq(schema.scholarships.status, "pending")).returning({ id: schema.scholarships.id });
    await audit(admin.user.id, "scholarships.publish_all", String(res.length));
    return done(`${res.length} published.`);
  } catch (e) { return fail(e); }
}

export async function markVerified(id: string): Promise<R> {
  try {
    const admin = await requireAdminAction();
    const msg = await verifyNow(uuid.parse(id));
    await audit(admin.user.id, "scholarships.verify", id);
    return done(msg);
  } catch (e) { return fail(e); }
}

export async function deleteScholarship(id: string): Promise<R> {
  try {
    const admin = await requireAdminAction();
    await db.delete(schema.scholarships).where(eq(schema.scholarships.id, uuid.parse(id)));
    await audit(admin.user.id, "scholarships.delete", id);
    return done("Deleted.");
  } catch (e) { return fail(e); }
}

export async function runRecheck(): Promise<R> {
  try {
    await requireAdminAction();
    const r = await recheckScholarships(15, 40_000);
    return done(`Checked ${r.checked}: ${r.changed} changed, ${r.broken} broken, ${r.skipped} could not be read automatically.`);
  } catch (e) { return fail(e); }
}

