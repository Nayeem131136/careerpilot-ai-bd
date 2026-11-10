import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { sameOrigin } from "@/lib/security";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({ id: z.string().uuid(), saved: z.boolean() });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ ok: false, message: "Forbidden." }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ ok: false, message: "Please sign in." }, { status: 401 });
  const d = body.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  if (d.data.saved) {
    const [sc] = await db.select({ id: schema.scholarships.id }).from(schema.scholarships).where(and(eq(schema.scholarships.id, d.data.id), eq(schema.scholarships.status, "published")));
    if (!sc) return Response.json({ ok: false, message: "Not found." }, { status: 404 });
    await db.insert(schema.scholarshipSaves).values({ userId: s.user.id, scholarshipId: d.data.id }).onConflictDoNothing();
  } else {
    await db.delete(schema.scholarshipSaves).where(and(eq(schema.scholarshipSaves.userId, s.user.id), eq(schema.scholarshipSaves.scholarshipId, d.data.id)));
  }
  return Response.json({ ok: true });
}
