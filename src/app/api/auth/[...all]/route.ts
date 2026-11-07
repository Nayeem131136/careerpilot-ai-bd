import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function handlers() {
  return toNextJsHandler(getAuth());
}

function unavailable(e: unknown) {
  const message = e instanceof Error ? e.message : "Authentication is not configured.";
  return Response.json({ error: "AUTH_NOT_CONFIGURED", message }, { status: 503 });
}

export async function GET(req: Request) {
  try { return await handlers().GET(req); } catch (e) { return unavailable(e); }
}
export async function POST(req: Request) {
  try { return await handlers().POST(req); } catch (e) { return unavailable(e); }
}
