import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { matchSchema } from "@/lib/jobs/match-types";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Skills that analysed jobs asked for and the CV lacked, counted across the user's AI match results. */
export async function skillGaps(userId: string) {
  const rows = await db.select({ data: schema.jobMatches.data, title: schema.jobs.title })
    .from(schema.jobMatches).innerJoin(schema.jobs, eq(schema.jobs.id, schema.jobMatches.jobId))
    .where(eq(schema.jobMatches.userId, userId)).orderBy(desc(schema.jobMatches.createdAt)).limit(100);
  const counts = new Map<string, { skill: string; jobs: number }>();
  const titles: string[] = [];
  for (const r of rows) {
    const m = matchSchema.safeParse(r.data);
    if (!m.success) continue;
    titles.push(r.title);
    const seen = new Set<string>();
    for (const sk of m.data.missingSkills) {
      const k = norm(sk);
      if (k.length < 2 || seen.has(k)) continue;
      seen.add(k);
      const cur = counts.get(k);
      if (cur) cur.jobs += 1; else counts.set(k, { skill: sk, jobs: 1 });
    }
  }
  const gaps = [...counts.values()].sort((a, b) => b.jobs - a.jobs || a.skill.localeCompare(b.skill)).slice(0, 20);
  return { gaps, analysed: titles.length, titles };
}
