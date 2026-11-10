import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { recheckScholarships } from "@/lib/scholarships/check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Weekly check of official scholarship pages. It only flags changes/broken links for an admin; it never edits content. */
export async function GET(req: Request) {
  const secret = env.CRON_SECRET;
  if (!secret || secret.length < 16) return Response.json({ ok: false, error: "CRON_SECRET is not configured." }, { status: 503 });
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return Response.json({ ok: false }, { status: 401 });
  return Response.json({ ok: true, ...(await recheckScholarships(25, 45_000)) });
}
