import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { refreshPublicPool } from "@/lib/jobs/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Daily refresh of the shared job pool. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  const secret = env.CRON_SECRET;
  if (!secret || secret.length < 16) return Response.json({ ok: false, error: "CRON_SECRET is not configured." }, { status: 503 });
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return Response.json({ ok: false }, { status: 401 });
  const results = await refreshPublicPool(false);
  return Response.json({ ok: true, results: results.map((r) => ({ source: r.source, status: r.status, count: r.count ?? 0 })) });
}
