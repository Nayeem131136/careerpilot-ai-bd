import { eq } from "drizzle-orm";
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
  const body = {
    exportedAt: new Date().toISOString(),
    account: { id: s.user.id, name: s.user.name, email: s.user.email, createdAt: s.user.createdAt },
    profile: profile ?? null,
    careerPreferences: prefs ?? null,
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="careerpilot-data-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
