import { z } from "zod";
import { logError } from "@/lib/errors/log";
import { sameOrigin } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ message: z.string().max(500), digest: z.string().max(40).optional(), path: z.string().max(300), stack: z.string().max(3000).optional() });

/** Browser-side crashes (the "Something went wrong" screens) report here. Stores no user data; same-origin only. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response(null, { status: 403 });
  const d = body.safeParse(await req.json().catch(() => null));
  if (!d.success) return new Response(null, { status: 400 });
  await logError({ source: "browser", message: d.data.message, digest: d.data.digest, path: d.data.path, stack: d.data.stack });
  return new Response(null, { status: 204 });
}
