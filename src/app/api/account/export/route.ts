import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Data export: returns only the signed-in user's own data. */
export async function GET() {
  const s = await getSession();
  if (!s) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const userId = s.user.id;
  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  const [prefs] = await db.select().from(schema.careerPreferences).where(eq(schema.careerPreferences.userId, userId));
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, userId));
  const jobState = await db.select({ jobId: schema.userJobState.jobId, state: schema.userJobState.state, createdAt: schema.userJobState.createdAt }).from(schema.userJobState).where(eq(schema.userJobState.userId, userId));
  const privateJobs = await db.select().from(schema.jobs).where(eq(schema.jobs.ownerUserId, userId));
  const matches = await db.select({ jobId: schema.jobMatches.jobId, score: schema.jobMatches.score, result: schema.jobMatches.data, createdAt: schema.jobMatches.createdAt }).from(schema.jobMatches).where(eq(schema.jobMatches.userId, userId));
  const applications = await db.select().from(schema.applications).where(eq(schema.applications.userId, userId));
  const drafts = await db.select().from(schema.applicationDrafts).where(and(eq(schema.applicationDrafts.userId, userId)));
  const [roadmap] = await db.select().from(schema.roadmaps).where(eq(schema.roadmaps.userId, userId));
  const body = {
    exportedAt: new Date().toISOString(),
    account: { id: s.user.id, name: s.user.name, email: s.user.email, createdAt: s.user.createdAt },
    profile: profile ?? null,
    careerPreferences: prefs ?? null,
    cv: cv ? { status: cv.status, parsed: cv.parsed, reviewedAt: cv.reviewedAt, updatedAt: cv.updatedAt } : null,
    jobsSavedOrHidden: jobState,
    jobsAddedByYou: privateJobs,
    aiMatches: matches,
    applications,
    applicationDrafts: drafts,
    roadmap: roadmap ? { targetRole: roadmap.targetRole, hoursPerWeek: roadmap.hoursPerWeek, plan: roadmap.data, progress: roadmap.progress } : null,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="careerpilot-data-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
