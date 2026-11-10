import { and, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { AiLimitError, AiNotConfiguredError } from "@/lib/ai/service";
import type { CvAnalysis } from "@/lib/cv/schema";
import { db, schema } from "@/lib/db";
import { matchJob, matchSchema } from "@/lib/jobs/match";
import { sameOrigin } from "@/lib/security";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const body = z.object({ jobId: z.string().uuid(), force: z.boolean().optional() });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ ok: false, message: "Forbidden." }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ ok: false, message: "Please sign in." }, { status: 401 });
  const d = body.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  const userId = s.user.id;

  const [job] = await db.select().from(schema.jobs).where(and(eq(schema.jobs.id, d.data.jobId), or(isNull(schema.jobs.ownerUserId), eq(schema.jobs.ownerUserId, userId))));
  if (!job) return Response.json({ ok: false, message: "Job not found." }, { status: 404 });
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, userId));
  if (!cv || cv.status !== "analyzed" || !cv.parsed) return Response.json({ ok: false, message: "Upload and review your CV first (My CV), then try again." }, { status: 400 });

  const [cached] = await db.select().from(schema.jobMatches).where(and(eq(schema.jobMatches.userId, userId), eq(schema.jobMatches.jobId, job.id)));
  if (cached && !d.data.force && cached.cvUpdatedAt.getTime() >= cv.updatedAt.getTime()) {
    const parsed = matchSchema.safeParse(cached.data);
    if (parsed.success) return Response.json({ ok: true, match: parsed.data, cached: true });
  }

  const [prefs] = await db.select().from(schema.careerPreferences).where(eq(schema.careerPreferences.userId, userId));
  try {
    const match = await matchJob(userId, {
      cv: cv.parsed as CvAnalysis,
      prefs: { roles: prefs?.jobTitles ?? [], countries: prefs?.countries ?? [], arrangements: prefs?.workArrangements ?? [] },
      job: { title: job.title, company: job.company, location: job.location, remote: job.remote, workMode: job.workMode, sector: job.sector, jobType: job.jobType, description: job.description },
    });
    await db.insert(schema.jobMatches).values({ userId, jobId: job.id, score: match.score, data: match, cvUpdatedAt: cv.updatedAt })
      .onConflictDoUpdate({ target: [schema.jobMatches.userId, schema.jobMatches.jobId], set: { score: match.score, data: match, cvUpdatedAt: cv.updatedAt, createdAt: new Date() } });
    return Response.json({ ok: true, match, cached: false });
  } catch (e) {
    const msg = e instanceof AiNotConfiguredError || e instanceof AiLimitError || (e instanceof Error && e.message.startsWith("The AI answered"))
      ? e.message : "The AI could not analyse this job right now. Please try again in a moment.";
    return Response.json({ ok: false, message: msg }, { status: 422 });
  }
}
