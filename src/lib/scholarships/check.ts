import "server-only";
import { createHash } from "node:crypto";
import { asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { allowedByRobots, fetchPublicPage } from "@/lib/jobs/safe-fetch";
import { htmlToText } from "@/lib/jobs/util";

type Fp = { ok: true; hash: string } | { ok: false; skipped: boolean; error: string };

/** Fingerprint of an official page's readable text. Used only to notice that "something changed". */
export async function fingerprint(url: string): Promise<Fp> {
  try {
    if (!(await allowedByRobots(url))) return { ok: false, skipped: true, error: "robots.txt does not allow automatic reading" };
    const page = await fetchPublicPage(url);
    const text = htmlToText(page.body, 30000).toLowerCase().replace(/\s+/g, " ").trim();
    if (text.length < 200) return { ok: false, skipped: true, error: "page has little readable text (it may need JavaScript)" };
    return { ok: true, hash: createHash("sha256").update(text).digest("hex") };
  } catch (e) {
    return { ok: false, skipped: false, error: e instanceof Error ? e.message : "error" };
  }
}

/**
 * Re-checks the oldest-checked published scholarships. Never edits content and never uses AI:
 * it only flags `changed` or `broken` so an admin looks at the official page.
 */
export async function recheckScholarships(limit = 15, budgetMs = 45_000) {
  const started = Date.now();
  const rows = await db.select().from(schema.scholarships)
    .where(eq(schema.scholarships.status, "published"))
    .orderBy(sql`${schema.scholarships.checkedAt} asc nulls first`, asc(schema.scholarships.createdAt)).limit(limit);
  const out = { checked: 0, changed: 0, broken: 0, skipped: 0 };
  for (const r of rows) {
    if (Date.now() - started > budgetMs) break;
    const fp = await fingerprint(r.officialUrl);
    const now = new Date();
    if (!fp.ok) {
      if (fp.skipped) { out.skipped++; await db.update(schema.scholarships).set({ checkedAt: now }).where(eq(schema.scholarships.id, r.id)); continue; }
      out.broken++; await db.update(schema.scholarships).set({ checkStatus: "broken", checkedAt: now }).where(eq(schema.scholarships.id, r.id)); continue;
    }
    out.checked++;
    if (!r.checkHash) { await db.update(schema.scholarships).set({ checkHash: fp.hash, checkStatus: "ok", checkedAt: now }).where(eq(schema.scholarships.id, r.id)); continue; }
    const changed = r.checkHash !== fp.hash;
    if (changed) out.changed++;
    await db.update(schema.scholarships).set({ checkStatus: changed ? "changed" : "ok", checkedAt: now }).where(eq(schema.scholarships.id, r.id));
  }
  return out;
}

/** Records the page as it is now and stamps "verified by admin". */
export async function verifyNow(id: string) {
  const [r] = await db.select().from(schema.scholarships).where(eq(schema.scholarships.id, id));
  if (!r) throw new Error("Not found.");
  const fp = await fingerprint(r.officialUrl);
  const now = new Date();
  await db.update(schema.scholarships).set({
    lastVerifiedAt: now, checkedAt: now, checkStatus: fp.ok ? "ok" : r.checkStatus === "broken" ? "broken" : "ok",
    ...(fp.ok ? { checkHash: fp.hash } : {}), updatedAt: now,
  }).where(eq(schema.scholarships.id, id));
  return fp.ok ? "Marked as verified." : `Marked as verified (the page could not be fingerprinted: ${fp.error}).`;
}
