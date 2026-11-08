import { and, eq } from "drizzle-orm";
import { analyzeCv } from "@/lib/cv/analyze";
import { CvError, cleanPasted, extractText } from "@/lib/cv/extract";
import { cvEditSchema, type CvAnalysis } from "@/lib/cv/schema";
import { AiLimitError, AiNotConfiguredError } from "@/lib/ai/service";
import { db, schema } from "@/lib/db";
import { sameOrigin } from "@/lib/security";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function guard(req: Request) {
  if (!sameOrigin(req)) return { res: json({ error: "Forbidden." }, 403) } as const;
  const s = await getSession();
  if (!s) return { res: json({ error: "Please sign in." }, 401) } as const;
  return { userId: s.user.id } as const;
}

function friendly(e: unknown): string {
  if (e instanceof CvError) return e.message;
  if (e instanceof AiNotConfiguredError) return "AI is not available right now. Your CV text was saved; try the analysis again later.";
  if (e instanceof AiLimitError) return e.message;
  return e instanceof Error && e.message.includes("unexpected format") ? e.message : "The analysis could not be completed. Your CV text was saved; please try again.";
}

/** Run the AI step and persist the outcome (never loses the extracted text). */
async function analyzeAndSave(userId: string, cvId: string, text: string) {
  try {
    const parsed = await analyzeCv(userId, text);
    await db.update(schema.cvs).set({ parsed, language: parsed.language, status: "analyzed", error: null, updatedAt: new Date() }).where(eq(schema.cvs.id, cvId));
    // Pre-fill empty profile fields only; never overwrite what the user wrote.
    const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
    if (!p) await db.insert(schema.profiles).values({ userId, headline: parsed.headline, experienceLevel: parsed.experienceLevel });
    else await db.update(schema.profiles).set({ headline: p.headline ?? parsed.headline, experienceLevel: p.experienceLevel ?? parsed.experienceLevel, updatedAt: new Date() }).where(eq(schema.profiles.userId, userId));
    return { ok: true as const };
  } catch (e) {
    const message = friendly(e);
    await db.update(schema.cvs).set({ status: "failed", error: message, updatedAt: new Date() }).where(eq(schema.cvs.id, cvId));
    return { ok: false as const, message };
  }
}

/** Upload a file (multipart "file") or paste text (multipart/JSON "text"). Replaces the current CV. */
export async function POST(req: Request) {
  const g = await guard(req);
  if ("res" in g) return g.res;
  try {
    let text: string; let fileName: string | null = null; let sourceType: "upload" | "paste";
    const type = req.headers.get("content-type") ?? "";
    if (type.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (file instanceof File && file.size > 0) {
        if (file.size > 4 * 1024 * 1024) throw new CvError("The file is larger than 4 MB. Please upload a smaller file or paste the text.");
        fileName = file.name.replace(/[^\w.\- ()]/g, "_").slice(0, 200);
        text = await extractText(Buffer.from(await file.arrayBuffer()), fileName);
        sourceType = "upload";
      } else {
        text = cleanPasted(String(form.get("text") ?? ""));
        sourceType = "paste";
      }
    } else {
      const b = (await req.json().catch(() => ({}))) as { text?: string };
      text = cleanPasted(String(b.text ?? ""));
      sourceType = "paste";
    }
    const values = { userId: g.userId, fileName, sourceType, rawText: text, parsed: null, language: null, status: "pending", error: null, reviewedAt: null, updatedAt: new Date() };
    const [row] = await db.insert(schema.cvs).values(values).onConflictDoUpdate({ target: schema.cvs.userId, set: values }).returning({ id: schema.cvs.id });
    const r = await analyzeAndSave(g.userId, row.id, text);
    return json(r.ok ? { ok: true } : { ok: false, message: r.message }, r.ok ? 200 : 422);
  } catch (e) {
    return json({ ok: false, message: friendly(e) }, e instanceof CvError ? 400 : 500);
  }
}

/** Save the user's corrections from the review screen. */
export async function PUT(req: Request) {
  const g = await guard(req);
  if ("res" in g) return g.res;
  const d = cvEditSchema.safeParse(await req.json().catch(() => null));
  if (!d.success) return json({ ok: false, message: "Some values are invalid. Please check the fields." }, 400);
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, g.userId));
  if (!cv?.parsed) return json({ ok: false, message: "No analysed CV found." }, 404);
  const merged: CvAnalysis = { ...(cv.parsed as CvAnalysis), ...d.data };
  await db.update(schema.cvs).set({ parsed: merged, reviewedAt: new Date(), updatedAt: new Date() }).where(and(eq(schema.cvs.id, cv.id), eq(schema.cvs.userId, g.userId)));
  return json({ ok: true });
}

/** Re-run the analysis on the saved text. */
export async function PATCH(req: Request) {
  const g = await guard(req);
  if ("res" in g) return g.res;
  const [cv] = await db.select().from(schema.cvs).where(eq(schema.cvs.userId, g.userId));
  if (!cv) return json({ ok: false, message: "No CV found." }, 404);
  await db.update(schema.cvs).set({ status: "pending", reviewedAt: null }).where(eq(schema.cvs.id, cv.id));
  const r = await analyzeAndSave(g.userId, cv.id, cv.rawText);
  return json(r.ok ? { ok: true } : { ok: false, message: r.message }, r.ok ? 200 : 422);
}

export async function DELETE(req: Request) {
  const g = await guard(req);
  if ("res" in g) return g.res;
  await db.delete(schema.cvs).where(eq(schema.cvs.userId, g.userId));
  return json({ ok: true });
}
