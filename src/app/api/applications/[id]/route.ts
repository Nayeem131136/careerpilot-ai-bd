import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { STATUSES } from "@/lib/applications/types";
import { sameOrigin } from "@/lib/security";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patch = z.object({ status: z.enum(STATUSES).optional(), notes: z.string().max(4000).optional(), deadline: z.string().trim().regex(/^(\d{4}-\d{2}-\d{2})?$/).optional() }).refine((v) => v.status !== undefined || v.notes !== undefined || v.deadline !== undefined);
const idOk = z.string().uuid();

async function owned(userId: string, id: string) {
  if (!idOk.safeParse(id).success) return null;
  const [row] = await db.select().from(schema.applications).where(and(eq(schema.applications.id, id), eq(schema.applications.userId, userId)));
  return row ?? null;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return Response.json({ ok: false, message: "Forbidden." }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ ok: false, message: "Please sign in." }, { status: 401 });
  const { id } = await ctx.params;
  const row = await owned(s.user.id, id);
  if (!row) return Response.json({ ok: false, message: "Not found." }, { status: 404 });
  const d = patch.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  const set: Partial<typeof schema.applications.$inferInsert> = { updatedAt: new Date() };
  if (d.data.notes !== undefined) set.notes = d.data.notes;
  if (d.data.deadline !== undefined) set.deadline = d.data.deadline === "" ? null : d.data.deadline;
  if (d.data.status !== undefined) {
    set.status = d.data.status;
    if (d.data.status === "applied" && !row.appliedAt) set.appliedAt = new Date();
  }
  await db.update(schema.applications).set(set).where(eq(schema.applications.id, row.id));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return Response.json({ ok: false, message: "Forbidden." }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ ok: false, message: "Please sign in." }, { status: 401 });
  const { id } = await ctx.params;
  const row = await owned(s.user.id, id);
  if (!row) return Response.json({ ok: false, message: "Not found." }, { status: 404 });
  await db.delete(schema.applications).where(eq(schema.applications.id, row.id));
  return Response.json({ ok: true });
}
