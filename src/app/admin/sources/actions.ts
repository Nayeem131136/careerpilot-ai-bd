"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { refreshPublicPool } from "@/lib/jobs/ingest";
import { allowedByRobots, fetchPublicPage } from "@/lib/jobs/safe-fetch";
import { parseFeed } from "@/lib/jobs/notices";
import { fetchGreenhouse, fetchLever, probeJooble, validToken } from "@/lib/jobs/sources";
import { env } from "@/lib/env";
import { requireAdminAction } from "@/lib/session";

type R = { ok: boolean; message: string };
const done = (message: string): R => { revalidatePath("/admin/sources"); return { ok: true, message }; };
const fail = (e: unknown): R => ({ ok: false, message: e instanceof Error ? e.message : "Something went wrong." });

const add = z.object({ name: z.string().trim().min(2).max(100), ats: z.enum(["greenhouse", "lever"]), token: z.string().trim().toLowerCase().refine(validToken, "Board token may only contain letters, numbers, - and _.") });

export async function addCompany(input: z.input<typeof add>): Promise<R> {
  try {
    const admin = await requireAdminAction();
    const d = add.safeParse(input);
    if (!d.success) return { ok: false, message: d.error.issues[0]?.message ?? "Invalid input." };
    // Verify the board really exists before saving it.
    const jobs = d.data.ats === "lever" ? await fetchLever(d.data.name, d.data.token) : await fetchGreenhouse(d.data.name, d.data.token);
    await db.insert(schema.companySources).values(d.data).onConflictDoNothing();
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: "jobs.company.add", target: `${d.data.ats}:${d.data.token}` });
    return done(`Added. The board currently has ${jobs.length} open jobs.`);
  } catch (e) {
    return { ok: false, message: `Could not read that board (${e instanceof Error ? e.message : "error"}). Check the token.` };
  }
}

export async function removeCompany(id: string): Promise<R> {
  try {
    const admin = await requireAdminAction();
    await db.delete(schema.companySources).where(eq(schema.companySources.id, z.string().uuid().parse(id)));
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: "jobs.company.remove", target: id });
    return done("Removed.");
  } catch (e) { return fail(e); }
}

export async function testJooble(): Promise<R> {
  try {
    await requireAdminAction();
    if (!env.JOOBLE_API_KEY) return { ok: false, message: "JOOBLE_API_KEY is not set on the server." };
    const lines = await probeJooble(env.JOOBLE_API_KEY);
    return { ok: !lines.every((l) => l.includes("returned 0") || /HTTP|network|timed|invalid/.test(l)), message: lines.join("\n") };
  } catch (e) { return fail(e); }
}

export async function refreshNow(): Promise<R> {
  try {
    await requireAdminAction();
    const r = await refreshPublicPool(true);
    const ok = r.filter((x) => x.status === "fetched").length, bad = r.filter((x) => x.status === "failed");
    return done(`${ok} source(s) refreshed.${bad.length ? ` Failed: ${bad.map((b) => `${b.source}/${b.key} (${b.error})`).join(", ")}.` : ""}`);
  } catch (e) { return fail(e); }
}

const pageIn = z.object({
  name: z.string().trim().min(2).max(100), url: z.string().trim().url().max(500), kind: z.enum(["rss", "html"]),
  sector: z.enum(["government", "private", "ngo"]), country: z.string().trim().max(60).optional(),
});

/** Registers a public notice page or RSS feed. We check it opens, is allowed by robots.txt, and (for RSS) yields items. */
export async function addPage(input: z.input<typeof pageIn>): Promise<R> {
  try {
    const admin = await requireAdminAction();
    const d = pageIn.safeParse(input);
    if (!d.success) return { ok: false, message: d.error.issues[0]?.message ?? "Invalid input." };
    if (!d.data.url.startsWith("https://")) return { ok: false, message: "Only https links are supported." };
    if (!(await allowedByRobots(d.data.url))) return { ok: false, message: "That page cannot be read automatically (its robots.txt disallows it, or the address is not allowed). Please do not add it." };
    const page = await fetchPublicPage(d.data.url);
    let note = "The page opens.";
    if (d.data.kind === "rss") {
      const items = parseFeed(page.body, { name: d.data.name, url: d.data.url, kind: "rss", sector: d.data.sector, country: d.data.country ?? null });
      if (items.length === 0) return { ok: false, message: "The link opened but no feed items were found. Is it really an RSS/Atom feed?" };
      note = `Feed OK: ${items.length} items.`;
    }
    await db.insert(schema.pageSources).values({ name: d.data.name, url: d.data.url, kind: d.data.kind, sector: d.data.sector, country: d.data.country || null }).onConflictDoNothing();
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: "jobs.page.add", target: d.data.url });
    return done(`Added. ${note}`);
  } catch (e) {
    return { ok: false, message: `Could not read that page (${e instanceof Error ? e.message : "error"}).` };
  }
}

export async function removePage(id: string): Promise<R> {
  try {
    const admin = await requireAdminAction();
    await db.delete(schema.pageSources).where(eq(schema.pageSources.id, z.string().uuid().parse(id)));
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: "jobs.page.remove", target: id });
    return done("Removed.");
  } catch (e) { return fail(e); }
}
