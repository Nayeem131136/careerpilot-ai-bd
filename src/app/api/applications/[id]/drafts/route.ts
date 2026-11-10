import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { AiLimitError, AiNotConfiguredError } from "@/lib/ai/service";
import { writeDraft } from "@/lib/applications/draft";
import { KINDS, TONES } from "@/lib/applications/types";
import type { CvAnalysis } from "@/lib/cv/schema";
import { db, schema } from "@/lib/db";
import { sameOrigin } from "@/lib/security";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const gen = z.object({ kind: z.enum(KINDS), language: z.enum(["en", "bn"]), tone: z.enum(TONES).default("professional"), instructions: z.string().trim().max(500).default("") });
const edit = z.object({ draftId: z.string().uuid(), subject: z.string().max(200), body: z.string().min(1).max(8000) });
const del = z.object({ draftId: z.string().uuid() });
const MAX_DRAFTS = 12;

async function guard(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return { err: Response.json({ ok: false, message: "Forbidden." }, { status: 403 }) };
  const s = await getSession();
  if (!s) return { err: Response.json({ ok: false, message: "Please sign in." }, { status: 401 }) };
  const { id } = await ctx.params;
  if (!z.string().uuid().safeParse(id).success) return { err: Response.json({ ok: false, message: "Not found." }, { status: 404 }) };
  const [app] = await db.select().from(schema.applications).where(and(eq(schema.applications.id, id), eq(schema.applications.userId, s.user.id)));
  if (!app) return { err: Response.json({ ok: false, message: "Not found." }, { status: 404 }) };
  return { s, app };
}

/** Generate a new draft. The draft is only saved here; it is never sent. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(req, ctx);
  if (g.err) return g.err;
  const d = gen.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  const { s, app } = g;
  const [{ n }] = await db.select({ n: count() }).from(schema.applicationDrafts).where(eq(schema.applicationDrafts.applicationId, app.id));
  if (n >= MAX_DRAFTS) return Response.json({ ok: false, message: `You can keep up to ${MAX_DRAFTS} drafts per application. Delete one first.` }, { status: 400 });
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, s.user.id));
  if (!cv || cv.status !== "analyzed" || !cv.parsed) return Response.json({ ok: false, message: "Upload and review your CV first (My CV), then try again." }, { status: 400 });
  try {
    const out = await writeDraft(s.user.id, { cv: cv.parsed as CvAnalysis, name: s.user.name, job: { title: app.jobTitle, company: app.company, location: app.location, description: app.jobDescription }, ...d.data });
    const [row] = await db.insert(schema.applicationDrafts).values({ applicationId: app.id, userId: s.user.id, kind: d.data.kind, language: d.data.language, subject: out.subject, body: out.body, instructions: d.data.instructions }).returning();
    if (app.status === "interested") await db.update(schema.applications).set({ status: "drafting", updatedAt: new Date() }).where(eq(schema.applications.id, app.id));
    else await db.update(schema.applications).set({ updatedAt: new Date() }).where(eq(schema.applications.id, app.id));
    return Response.json({ ok: true, draft: { id: row.id, kind: row.kind, language: row.language, subject: row.subject, body: row.body, createdAt: row.createdAt.toISOString() } });
  } catch (e) {
    const msg = e instanceof AiNotConfiguredError || e instanceof AiLimitError || (e instanceof Error && e.message.startsWith("The AI answered"))
      ? e.message : "The AI could not write the draft right now. Please try again in a moment.";
    return Response.json({ ok: false, message: msg }, { status: 422 });
  }
}

/** Save the user's own edits to a draft. */
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(req, ctx);
  if (g.err) return g.err;
  const d = edit.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  const r = await db.update(schema.applicationDrafts).set({ subject: d.data.subject, body: d.data.body, updatedAt: new Date() })
    .where(and(eq(schema.applicationDrafts.id, d.data.draftId), eq(schema.applicationDrafts.applicationId, g.app!.id), eq(schema.applicationDrafts.userId, g.s!.user.id))).returning({ id: schema.applicationDrafts.id });
  if (r.length === 0) return Response.json({ ok: false, message: "Draft not found." }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard(req, ctx);
  if (g.err) return g.err;
  const d = del.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  await db.delete(schema.applicationDrafts).where(and(eq(schema.applicationDrafts.id, d.data.draftId), eq(schema.applicationDrafts.applicationId, g.app!.id), eq(schema.applicationDrafts.userId, g.s!.user.id)));
  return Response.json({ ok: true });
}
