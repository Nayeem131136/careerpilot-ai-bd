import { and, desc, eq, gt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { refreshForUser, refreshPublicPool } from "@/lib/jobs/ingest";
import { sameOrigin } from "@/lib/security";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ ok: false, message: "Forbidden." }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ ok: false, message: "Please sign in." }, { status: 401 });
  const since = new Date(Date.now() - 5 * 60_000);
  const [recent] = await db.select({ at: schema.auditLogs.createdAt }).from(schema.auditLogs)
    .where(and(eq(schema.auditLogs.actorId, s.user.id), eq(schema.auditLogs.action, "jobs.refresh"), gt(schema.auditLogs.createdAt, since))).orderBy(desc(schema.auditLogs.createdAt)).limit(1);
  if (recent) return Response.json({ ok: false, message: "You refreshed a moment ago. Please wait a few minutes." }, { status: 429 });
  await db.insert(schema.auditLogs).values({ actorId: s.user.id, action: "jobs.refresh" });
  const results = [...(await refreshPublicPool(false)), ...(await refreshForUser(s.user.id))];
  const fetched = results.filter((r) => r.status === "fetched").reduce((a, r) => a + (r.count ?? 0), 0);
  return Response.json({
    ok: true, fetched,
    sources: results.map((r) => ({ source: r.source, status: r.status, count: r.count ?? 0, note: r.status === "failed" || r.status === "skipped" ? r.error : undefined })),
  });
}
