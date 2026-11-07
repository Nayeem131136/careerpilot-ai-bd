import { sql } from "drizzle-orm";
import { db, dbConfigured } from "@/lib/db";
import { features, authSecret } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Safe status endpoint: reports configuration state only, never secret values. */
export async function GET() {
  let database: "ok" | "error" | "not_configured" = "not_configured";
  if (dbConfigured) {
    try {
      await db.execute(sql`select 1`);
      database = "ok";
    } catch {
      database = "error";
    }
  }
  const status = database === "ok" && Boolean(authSecret) ? "ok" : "degraded";
  return Response.json(
    {
      status,
      database,
      auth: authSecret ? "configured" : "not_configured",
      oauth: { google: features.google, github: features.github, linkedin: features.linkedin },
      email: features.email ? "configured" : "not_configured",
      storage: features.blob ? "configured" : "not_configured",
      aiEncryptionSecret: features.encryptionSecret ? "configured" : "not_configured",
      ai: "not_configured_yet (Phase 2)",
      time: new Date().toISOString(),
    },
    { status: status === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
