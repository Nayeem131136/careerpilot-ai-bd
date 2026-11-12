import "server-only";
import { createHash } from "node:crypto";
import { desc, eq, lt, notInArray, and, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const IGNORE = /NEXT_REDIRECT|NEXT_NOT_FOUND|ECONNRESET|aborted|socket hang up|Failed to fetch RSC payload|Load failed|ResizeObserver/i;

/** Removes things that could identify a person or leak a secret before an error is stored. */
export function scrub(s: string, max: number): string {
  return s
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[email]")
    .replace(/\b[A-Za-z0-9_\-]{32,}\b/g, "[token]")
    .replace(/(postgres(ql)?|https?):\/\/[^\s"')]+/gi, (m) => m.split("?")[0].replace(/\/\/[^@/]*@/, "//"))
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, ":id")
    .slice(0, max);
}
export const cleanPath = (p: string) => scrub(p.split("?")[0].split("#")[0], 200);

let windowStart = 0, inWindow = 0;
const allowed = () => { const now = Date.now(); if (now - windowStart > 60_000) { windowStart = now; inWindow = 0; } return ++inWindow <= 40; };

export type LogInput = { source: "server" | "browser"; message: string; path: string; routeType?: string | null; digest?: string | null; stack?: string | null };

/** Stores (or counts again) an error. Never throws, so logging can never break a request. */
export async function logError(i: LogInput): Promise<void> {
  try {
    if (!allowed() || IGNORE.test(i.message)) return;
    // A browser crash of a server error carries the same digest as the server record: it adds nothing, so skip it.
    if (i.source === "browser" && i.digest) {
      const [dup] = await db.select({ id: schema.errorLogs.id }).from(schema.errorLogs).where(and(eq(schema.errorLogs.digest, i.digest.slice(0, 40)), eq(schema.errorLogs.source, "server"))).limit(1);
      if (dup) return;
    }
    const message = scrub(i.message || "Unknown error", 400);
    const path = cleanPath(i.path || "");
    const fingerprint = createHash("sha1").update([i.source, message.split("\n")[0], path, i.routeType ?? ""].join("|")).digest("hex");
    const now = new Date();
    await db.insert(schema.errorLogs).values({ fingerprint, source: i.source, message, path, routeType: i.routeType ?? null, digest: i.digest?.slice(0, 40) ?? null, stack: i.stack ? scrub(i.stack, 1800) : null })
      .onConflictDoUpdate({ target: schema.errorLogs.fingerprint, set: { count: sql`${schema.errorLogs.count} + 1`, lastSeenAt: now, status: "open", digest: i.digest?.slice(0, 40) ?? sql`${schema.errorLogs.digest}`, stack: i.stack ? scrub(i.stack, 1800) : sql`${schema.errorLogs.stack}` } });
  } catch { /* logging must never fail the request */ }
}

/** Resolved errors older than 30 days go; the table never keeps more than 500 rows. */
export async function pruneErrors() {
  try {
    await db.delete(schema.errorLogs).where(and(eq(schema.errorLogs.status, "resolved"), lt(schema.errorLogs.lastSeenAt, new Date(Date.now() - 30 * 864e5))));
    const keep = await db.select({ id: schema.errorLogs.id }).from(schema.errorLogs).orderBy(desc(schema.errorLogs.lastSeenAt)).limit(500);
    if (keep.length === 500) await db.delete(schema.errorLogs).where(notInArray(schema.errorLogs.id, keep.map((k) => k.id)));
  } catch { /* best effort */ }
}
