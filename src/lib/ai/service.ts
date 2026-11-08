import "server-only";
import { and, count, eq, gte } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { decryptSecret } from "./crypto";
import { callProvider, type LlmRequest, type LlmResult } from "./adapters";
import { providerDef, type TaskKey } from "./providers";

export class AiNotConfiguredError extends Error {
  constructor() { super("AI is not configured yet. The site admin needs to connect a provider."); }
}
export class AiLimitError extends Error {
  constructor() { super("Daily AI limit reached. Please try again tomorrow."); }
}

export async function getAiSettings() {
  const [s] = await db.select().from(schema.aiSettings).where(eq(schema.aiSettings.id, "global"));
  return s ?? { id: "global", primaryProviderId: null, fallbackProviderId: null, routing: {}, dailyUserLimit: 50, updatedAt: new Date() };
}

/** Public, secret-free status used by dashboards and /api/health. */
export async function getAiStatus() {
  try {
    const s = await getAiSettings();
    if (!s.primaryProviderId) return { configured: false as const };
    const [p] = await db.select().from(schema.aiProviders).where(eq(schema.aiProviders.id, s.primaryProviderId));
    return { configured: Boolean(p?.enabled), provider: p?.label, model: p?.model };
  } catch {
    return { configured: false as const };
  }
}

type ProviderRow = typeof schema.aiProviders.$inferSelect;

async function run(row: ProviderRow, req: LlmRequest, modelOverride?: string): Promise<{ r: LlmResult; model: string }> {
  const def = providerDef(row.providerKey);
  if (!def) throw new Error(`Unknown provider "${row.providerKey}".`);
  const model = modelOverride || row.model;
  const r = await callProvider(def.type, { apiKey: decryptSecret(row.apiKeyEnc), model, baseUrl: row.baseUrl ?? def.baseUrl }, req);
  return { r, model };
}

async function log(row: ProviderRow, model: string, task: string, userId: string | null, ok: boolean, started: number, r?: LlmResult, error?: string) {
  try {
    await db.insert(schema.aiUsage).values({
      userId, task, providerKey: row.providerKey, model, ok, latencyMs: Date.now() - started,
      inputTokens: r?.inputTokens, outputTokens: r?.outputTokens, error: error?.slice(0, 300),
    });
  } catch { /* logging must never break a request */ }
}

/**
 * Single entry point for all AI work. Resolves per-task routing, falls back to the
 * secondary provider on failure, enforces a per-user daily limit and records usage.
 */
export async function generate(opts: { task: TaskKey; userId?: string | null; system?: string; prompt: string; maxTokens?: number; temperature?: number }): Promise<LlmResult & { provider: string; model: string }> {
  const settings = await getAiSettings();
  const route = settings.routing?.[opts.task];
  const firstId = route?.providerId || settings.primaryProviderId;
  if (!firstId) throw new AiNotConfiguredError();

  if (opts.userId) {
    const since = new Date(); since.setUTCHours(0, 0, 0, 0);
    const [{ n }] = await db.select({ n: count() }).from(schema.aiUsage)
      .where(and(eq(schema.aiUsage.userId, opts.userId), eq(schema.aiUsage.ok, true), gte(schema.aiUsage.createdAt, since)));
    if (n >= settings.dailyUserLimit) throw new AiLimitError();
  }

  const ids = [firstId, settings.fallbackProviderId].filter((x, i, a): x is string => Boolean(x) && a.indexOf(x) === i);
  let lastErr = "AI request failed.";
  for (const [i, id] of ids.entries()) {
    const [row] = await db.select().from(schema.aiProviders).where(eq(schema.aiProviders.id, id));
    if (!row || !row.enabled) continue;
    const started = Date.now();
    const modelOverride = i === 0 ? route?.model : undefined;
    try {
      const { r, model } = await run(row, opts, modelOverride);
      await log(row, model, opts.task, opts.userId ?? null, true, started, r);
      return { ...r, provider: row.label, model };
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      await log(row, modelOverride || row.model, opts.task, opts.userId ?? null, false, started, undefined, lastErr);
    }
  }
  if (lastErr === "AI request failed.") throw new AiNotConfiguredError();
  throw new Error("The AI provider could not complete the request. Please try again.");
}

/** Admin "Test connection": one tiny call, result stored on the provider row. */
export async function testProvider(id: string, userId: string) {
  const [row] = await db.select().from(schema.aiProviders).where(eq(schema.aiProviders.id, id));
  if (!row) return { ok: false, message: "Provider not found." };
  const started = Date.now();
  let ok = false; let message = "";
  try {
    const { r, model } = await run(row, { prompt: "Reply with the single word: OK", maxTokens: 16, temperature: 0 });
    ok = true; message = `Connected (${Date.now() - started} ms). Reply: ${r.text.trim().slice(0, 40)}`;
    await log(row, model, "test", userId, true, started, r);
  } catch (e) {
    message = (e instanceof Error ? e.message : String(e)).slice(0, 300);
    await log(row, row.model, "test", userId, false, started, undefined, message);
  }
  await db.update(schema.aiProviders).set({ lastTestAt: new Date(), lastTestOk: ok, lastTestMsg: message }).where(eq(schema.aiProviders.id, id));
  return { ok, message };
}
