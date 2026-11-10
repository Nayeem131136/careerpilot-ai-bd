import { eq } from "drizzle-orm";
import { z } from "zod";
import { AiLimitError, AiNotConfiguredError } from "@/lib/ai/service";
import type { CvAnalysis } from "@/lib/cv/schema";
import { db, schema } from "@/lib/db";
import { buildRoadmap } from "@/lib/roadmap/generate";
import { skillGaps } from "@/lib/roadmap/gaps";
import { HOURS, PROGRESS_KEY, itemKeys, roadmapSchema } from "@/lib/roadmap/schema";
import { sameOrigin } from "@/lib/security";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const gen = z.object({ targetRole: z.string().trim().min(2).max(100), hoursPerWeek: z.coerce.number().refine((n) => (HOURS as readonly number[]).includes(n)) });
const prog = z.object({ key: z.string().regex(PROGRESS_KEY), done: z.boolean() });

async function auth(req: Request) {
  if (!sameOrigin(req)) return { err: Response.json({ ok: false, message: "Forbidden." }, { status: 403 }) };
  const s = await getSession();
  if (!s) return { err: Response.json({ ok: false, message: "Please sign in." }, { status: 401 }) };
  return { s };
}

/** Build (or rebuild) the user's roadmap. Rebuilding resets progress. */
export async function POST(req: Request) {
  const a = await auth(req);
  if (a.err) return a.err;
  const userId = a.s!.user.id;
  const d = gen.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false, message: "Choose a target role and weekly hours." }, { status: 400 });
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, userId));
  if (!cv || cv.status !== "analyzed" || !cv.parsed) return Response.json({ ok: false, message: "Upload and review your CV first (My CV), then try again." }, { status: 400 });
  try {
    const { gaps, titles } = await skillGaps(userId);
    const roadmap = await buildRoadmap(userId, { cv: cv.parsed as CvAnalysis, targetRole: d.data.targetRole, hoursPerWeek: d.data.hoursPerWeek, gaps, jobTitles: titles });
    await db.insert(schema.roadmaps).values({ userId, targetRole: d.data.targetRole, hoursPerWeek: d.data.hoursPerWeek, data: roadmap, progress: {}, cvUpdatedAt: cv.updatedAt })
      .onConflictDoUpdate({ target: schema.roadmaps.userId, set: { targetRole: d.data.targetRole, hoursPerWeek: d.data.hoursPerWeek, data: roadmap, progress: {}, cvUpdatedAt: cv.updatedAt, updatedAt: new Date() } });
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof AiNotConfiguredError || e instanceof AiLimitError || (e instanceof Error && e.message.startsWith("The AI answered"))
      ? e.message : "The AI could not build the roadmap right now. Please try again in a moment.";
    return Response.json({ ok: false, message: msg }, { status: 422 });
  }
}

/** Tick or untick one checklist item. */
export async function PATCH(req: Request) {
  const a = await auth(req);
  if (a.err) return a.err;
  const d = prog.safeParse(await req.json().catch(() => null));
  if (!d.success) return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  const [row] = await db.select().from(schema.roadmaps).where(eq(schema.roadmaps.userId, a.s!.user.id));
  if (!row) return Response.json({ ok: false, message: "No roadmap yet." }, { status: 404 });
  const r = roadmapSchema.safeParse(row.data);
  if (!r.success || !itemKeys(r.data).includes(d.data.key)) return Response.json({ ok: false, message: "Unknown item." }, { status: 400 });
  const progress = { ...(row.progress as Record<string, boolean>) };
  if (d.data.done) progress[d.data.key] = true; else delete progress[d.data.key];
  await db.update(schema.roadmaps).set({ progress, updatedAt: new Date() }).where(eq(schema.roadmaps.id, row.id));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const a = await auth(req);
  if (a.err) return a.err;
  await db.delete(schema.roadmaps).where(eq(schema.roadmaps.userId, a.s!.user.id));
  return Response.json({ ok: true });
}
