import { and, count, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { sameOrigin } from "@/lib/security";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ jobId: z.string().uuid() });
const MAX_APPS = 300;

/** Create (or return the existing) application for a job. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ ok: false, message: "Forbidden." }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ ok: false, message: "Please sign in." }, { status: 401 });
  const d = body.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  const userId = s.user.id;

  const [existing] = await db.select({ id: schema.applications.id }).from(schema.applications).where(and(eq(schema.applications.userId, userId), eq(schema.applications.jobId, d.data.jobId)));
  if (existing) return Response.json({ ok: true, id: existing.id });
  const [job] = await db.select().from(schema.jobs).where(and(eq(schema.jobs.id, d.data.jobId), or(isNull(schema.jobs.ownerUserId), eq(schema.jobs.ownerUserId, userId))));
  if (!job) return Response.json({ ok: false, message: "Job not found." }, { status: 404 });
  const [{ n }] = await db.select({ n: count() }).from(schema.applications).where(eq(schema.applications.userId, userId));
  if (n >= MAX_APPS) return Response.json({ ok: false, message: `You can track up to ${MAX_APPS} applications. Delete old ones first.` }, { status: 400 });

  const [row] = await db.insert(schema.applications).values({
    userId, jobId: job.id, jobTitle: job.title, company: job.company, location: job.location, jobUrl: /^https?:\/\//.test(job.url) ? job.url : null,
    jobDescription: job.description.slice(0, 6000), deadline: job.deadline, status: "interested",
  }).onConflictDoNothing().returning({ id: schema.applications.id });
  if (row) return Response.json({ ok: true, id: row.id });
  const [again] = await db.select({ id: schema.applications.id }).from(schema.applications).where(and(eq(schema.applications.userId, userId), eq(schema.applications.jobId, job.id)));
  return Response.json({ ok: true, id: again?.id });
}
