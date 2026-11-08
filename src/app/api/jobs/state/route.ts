import { and, eq, or, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { sameOrigin } from "@/lib/security";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ jobId: z.string().uuid(), state: z.enum(["saved", "hidden"]).nullable() });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ ok: false }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ ok: false }, { status: 401 });
  const d = body.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false }, { status: 400 });
  const [job] = await db.select({ id: schema.jobs.id }).from(schema.jobs)
    .where(and(eq(schema.jobs.id, d.data.jobId), or(isNull(schema.jobs.ownerUserId), eq(schema.jobs.ownerUserId, s.user.id))));
  if (!job) return Response.json({ ok: false }, { status: 404 });
  if (d.data.state === null) await db.delete(schema.userJobState).where(and(eq(schema.userJobState.userId, s.user.id), eq(schema.userJobState.jobId, job.id)));
  else await db.insert(schema.userJobState).values({ userId: s.user.id, jobId: job.id, state: d.data.state })
    .onConflictDoUpdate({ target: [schema.userJobState.userId, schema.userJobState.jobId], set: { state: d.data.state } });
  return Response.json({ ok: true });
}
