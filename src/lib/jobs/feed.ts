import "server-only";
import { and, desc, eq, ilike, inArray, isNull, notInArray, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import type { CvAnalysis } from "@/lib/cv/schema";
import { rankJob, type RankProfile, type Ranked } from "./rank";

export type FeedFilters = { q?: string; country?: string; remote?: boolean; source?: string; sector?: string; workMode?: string; saved?: boolean; page: number };
export type FeedJob = typeof schema.jobs.$inferSelect & { rank: Ranked; saved: boolean };
const PAGE = 20;

export async function loadRankProfile(userId: string): Promise<RankProfile & { cvStatus: "none" | "ready" }> {
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, userId));
  const [prefs] = await db.select().from(schema.careerPreferences).where(eq(schema.careerPreferences.userId, userId));
  const [prof] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  const parsed = cv?.status === "analyzed" ? (cv.parsed as CvAnalysis | null) : null;
  const roles = [...(prefs?.jobTitles ?? []), ...(parsed?.suggestedRoles.map((r) => r.title) ?? [])];
  const skills = parsed?.skills ?? [];
  return {
    roles, skills, countries: prefs?.countries ?? [], arrangements: prefs?.workArrangements ?? [],
    level: prof?.experienceLevel ?? parsed?.experienceLevel ?? null,
    hasSignal: roles.length > 0 || skills.length > 0, cvStatus: parsed ? "ready" : "none",
  };
}

export async function getFeed(userId: string, f: FeedFilters) {
  const profile = await loadRankProfile(userId);
  const states = await db.select({ jobId: schema.userJobState.jobId, state: schema.userJobState.state }).from(schema.userJobState).where(eq(schema.userJobState.userId, userId));
  const hidden = states.filter((s) => s.state === "hidden").map((s) => s.jobId);
  const savedIds = new Set(states.filter((s) => s.state === "saved").map((s) => s.jobId));

  const where: (SQL | undefined)[] = [or(isNull(schema.jobs.ownerUserId), eq(schema.jobs.ownerUserId, userId))];
  if (hidden.length) where.push(notInArray(schema.jobs.id, hidden));
  if (f.country) where.push(eq(schema.jobs.country, f.country));
  else {
    // Default scope: every kind of job in Bangladesh, but only remote jobs from elsewhere.
    where.push(or(
      eq(schema.jobs.country, "Bangladesh"),
      eq(schema.jobs.remote, true),
      eq(schema.jobs.workMode, "remote"),
      and(isNull(schema.jobs.country), inArray(schema.jobs.source, ["curated", "notice", "pasted"])),
    ));
  }
  if (f.remote) where.push(eq(schema.jobs.remote, true));
  if (f.source) where.push(eq(schema.jobs.source, f.source));
  if (f.sector) where.push(eq(schema.jobs.sector, f.sector));
  if (f.workMode) where.push(eq(schema.jobs.workMode, f.workMode));
  if (f.q) { const like = `%${f.q.replace(/[%_\\]/g, "\\$&")}%`; where.push(or(ilike(schema.jobs.title, like), ilike(schema.jobs.company, like))); }
  if (f.saved) { if (savedIds.size === 0) return { jobs: [], total: 0, pages: 1, profile }; where.push(inArray(schema.jobs.id, [...savedIds])); }

  const rows = await db.select().from(schema.jobs).where(and(...where))
    .orderBy(desc(sql`coalesce(${schema.jobs.postedAt}, ${schema.jobs.fetchedAt})`)).limit(800);

  const seen = new Set<string>();
  const ranked: FeedJob[] = [];
  for (const r of rows.sort((a, b) => Number(Boolean(b.ownerUserId)) - Number(Boolean(a.ownerUserId)))) {
    if (seen.has(r.dedupeKey)) continue;
    seen.add(r.dedupeKey);
    ranked.push({ ...r, rank: rankJob(r, profile), saved: savedIds.has(r.id) });
  }
  ranked.sort((a, b) => b.rank.score - a.rank.score || (b.postedAt?.getTime() ?? 0) - (a.postedAt?.getTime() ?? 0));
  const pages = Math.max(1, Math.ceil(ranked.length / PAGE));
  const page = Math.min(Math.max(1, f.page), pages);
  return { jobs: ranked.slice((page - 1) * PAGE, page * PAGE), total: ranked.length, pages, page, profile };
}
