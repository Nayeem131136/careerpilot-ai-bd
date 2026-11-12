import "server-only";
import { and, desc, eq, gt, inArray, lt, sql } from "drizzle-orm";
import { daysLeft, parseDeadline } from "@/lib/deadlines/parse";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import type { CvAnalysis } from "@/lib/cv/schema";
import { dedupeKey } from "./util";
import type { NormalizedJob } from "./types";
import { fetchNoticeSource } from "./notices";
import { ADZUNA_COUNTRIES, fetchAdzuna, fetchArbeitnow, fetchGreenhouse, fetchJobicy, fetchJooble, fetchLever } from "./sources";

const HOUR = 3_600_000;
const TTL = { pool: 6 * HOUR, company: 12 * HOUR, query: 12 * HOUR };
const MAX_AGE_DAYS = 60;

export type SourceResult = { source: string; key: string; status: "fetched" | "cached" | "failed" | "skipped"; count?: number; error?: string };

async function recently(source: string, queryKey: string, ttl: number) {
  const since = new Date(Date.now() - ttl);
  const [r] = await db.select({ id: schema.jobFetchLog.id }).from(schema.jobFetchLog)
    .where(and(eq(schema.jobFetchLog.source, source), eq(schema.jobFetchLog.queryKey, queryKey), eq(schema.jobFetchLog.ok, true), gt(schema.jobFetchLog.fetchedAt, since))).limit(1);
  return Boolean(r);
}

export async function upsertJobs(list: NormalizedJob[], ownerUserId: string | null = null): Promise<number> {
  const seen = new Map<string, NormalizedJob>();
  for (const j of list) seen.set(`${j.source}|${j.externalId}`, j);
  const rows = [...seen.values()].map((j) => ({ ...j, ownerUserId, dedupeKey: dedupeKey(j.title, j.company, j.country), fetchedAt: new Date() }));
  for (let i = 0; i < rows.length; i += 100) {
    await db.insert(schema.jobs).values(rows.slice(i, i + 100)).onConflictDoUpdate({
      target: [schema.jobs.source, schema.jobs.externalId],
      set: {
        title: sql`excluded.title`, company: sql`excluded.company`, location: sql`excluded.location`, country: sql`excluded.country`, remote: sql`excluded.remote`,
        jobType: sql`excluded.job_type`, description: sql`excluded.description`, url: sql`excluded.url`, postedAt: sql`excluded.posted_at`,
        salaryMin: sql`excluded.salary_min`, salaryMax: sql`excluded.salary_max`, salaryCurrency: sql`excluded.salary_currency`, tags: sql`excluded.tags`,
        dedupeKey: sql`excluded.dedupe_key`, sector: sql`excluded.sector`, workMode: sql`excluded.work_mode`, deadline: sql`excluded.deadline`, fetchedAt: sql`excluded.fetched_at`,
      },
    });
  }
  return rows.length;
}

async function runSource(source: string, key: string, ttl: number, force: boolean, fn: () => Promise<NormalizedJob[]>): Promise<SourceResult> {
  if (!force && (await recently(source, key, ttl))) return { source, key, status: "cached" };
  try {
    const n = await upsertJobs(await fn());
    await db.insert(schema.jobFetchLog).values({ source, queryKey: key, ok: true, count: n });
    return { source, key, status: "fetched", count: n };
  } catch (e) {
    const error = e instanceof Error ? e.message.slice(0, 200) : "failed";
    await db.insert(schema.jobFetchLog).values({ source, queryKey: key, ok: false, count: 0, error });
    return { source, key, status: "failed", error };
  }
}

async function inChunks<T>(items: T[], size: number, fn: (x: T) => Promise<SourceResult>) {
  const out: SourceResult[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

/** Shared pool: key-free sources + the admin's company registry. Safe to call often (TTL-cached). */
export async function refreshPublicPool(force = false): Promise<SourceResult[]> {
  const results: SourceResult[] = [];
  results.push(await runSource("jobicy", "all", TTL.pool, force, fetchJobicy));
  results.push(await runSource("arbeitnow", "all", TTL.pool, force, fetchArbeitnow));
  const companies = await db.select().from(schema.companySources).where(eq(schema.companySources.enabled, true)).limit(60);
  results.push(...(await inChunks(companies, 4, async (c) => {
    const r = await runSource(c.ats, c.token, TTL.company, force, () => (c.ats === "lever" ? fetchLever(c.name, c.token) : fetchGreenhouse(c.name, c.token)));
    if (r.status !== "cached") await db.update(schema.companySources).set({ lastFetchAt: new Date(), lastCount: r.count ?? 0, lastError: r.error ?? null }).where(eq(schema.companySources.id, c.id));
    return r;
  })));
  const pages = await db.select().from(schema.pageSources).where(eq(schema.pageSources.enabled, true)).limit(30);
  results.push(...(await inChunks(pages, 2, async (p) => {
    const r = await runSource("notice", p.url, TTL.company, force, () => fetchNoticeSource(p));
    if (r.status !== "cached") await db.update(schema.pageSources).set({ lastFetchAt: new Date(), lastCount: r.count ?? 0, lastError: r.error ?? null }).where(eq(schema.pageSources.id, p.id));
    return r;
  })));
  await db.delete(schema.jobs).where(and(sql`${schema.jobs.ownerUserId} is null`, lt(sql`coalesce(${schema.jobs.postedAt}, ${schema.jobs.fetchedAt})`, new Date(Date.now() - MAX_AGE_DAYS * 864e5))));
  await removeClosedJobs();
  return results;
}

/** Deletes public jobs whose deadline passed more than 30 days ago (their date is read from the deadline text). */
async function removeClosedJobs() {
  const rows = await db.select({ id: schema.jobs.id, deadline: schema.jobs.deadline }).from(schema.jobs)
    .where(and(sql`${schema.jobs.ownerUserId} is null`, sql`${schema.jobs.deadline} is not null`)).limit(5000);
  const now = new Date();
  const old = rows.filter((r) => { const d = parseDeadline(r.deadline); return d && daysLeft(d, now) < -30; }).map((r) => r.id);
  for (let i = 0; i < old.length; i += 200) await db.delete(schema.jobs).where(inArray(schema.jobs.id, old.slice(i, i + 200)));
}

/** Query-style sources (Adzuna, Jooble) driven by this user's CV and preferences. Few calls, cached 12h. */
export async function refreshForUser(userId: string): Promise<SourceResult[]> {
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, userId));
  const [prefs] = await db.select().from(schema.careerPreferences).where(eq(schema.careerPreferences.userId, userId));
  const parsed = cv?.parsed as CvAnalysis | null | undefined;
  const roles = [...(prefs?.jobTitles ?? []), ...(parsed?.suggestedRoles.map((r) => r.title) ?? [])].filter((t, i, a) => a.indexOf(t) === i).slice(0, 2);
  const countries = (prefs?.countries ?? []).filter((c) => !c.startsWith("Remote"));
  const results: SourceResult[] = [];
  if (roles.length === 0) return [{ source: "query", key: "-", status: "skipped", error: "Upload and review your CV (or set job titles) to personalise the search." }];

  if (env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY) {
    const targets = countries.filter((c) => ADZUNA_COUNTRIES[c]).slice(0, 2);
    const jobs = targets.flatMap((c) => roles.map((r) => ({ c, r })));
    results.push(...(await inChunks(jobs.slice(0, 4), 2, ({ c, r }) => runSource("adzuna", `${c}|${r.toLowerCase()}`, TTL.query, false, () => fetchAdzuna(env.ADZUNA_APP_ID!, env.ADZUNA_APP_KEY!, c, r)))));
  }
  if (env.JOOBLE_API_KEY) {
    const locs = ["Bangladesh", ...countries.filter((c) => c !== "Bangladesh")].slice(0, 3);
    const jobs = locs.map((l) => ({ l, r: roles[0] }));
    results.push(...(await inChunks(jobs, 3, ({ l, r }) => runSource("jooble", `${l}|${r.toLowerCase()}`, TTL.query, false, () => fetchJooble(env.JOOBLE_API_KEY!, r, l)))));
  }
  return results;
}

export async function coverage() {
  const byCountry = await db.select({ source: schema.jobs.source, country: schema.jobs.country, n: sql<number>`count(*)::int` })
    .from(schema.jobs).where(sql`${schema.jobs.ownerUserId} is null`).groupBy(schema.jobs.source, schema.jobs.country);
  const logs = await db.select().from(schema.jobFetchLog).orderBy(desc(schema.jobFetchLog.fetchedAt)).limit(200);
  const latest = new Map<string, (typeof logs)[number]>();
  for (const l of logs) if (!latest.has(l.source)) latest.set(l.source, l);
  const bySource = new Map<string, number>();
  for (const r of byCountry) bySource.set(r.source, (bySource.get(r.source) ?? 0) + r.n);
  const bd = byCountry.filter((r) => r.country === "Bangladesh").reduce((a, r) => a + r.n, 0);
  return { bySource: [...bySource.entries()].map(([source, n]) => ({ source, n, last: latest.get(source) ?? null })), bangladesh: bd, total: [...bySource.values()].reduce((a, b) => a + b, 0) };
}
