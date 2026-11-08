import "server-only";
import type { ProviderType } from "./providers";

export type LlmRequest = { system?: string; prompt: string; maxTokens?: number; temperature?: number };
export type LlmResult = { text: string; inputTokens?: number; outputTokens?: number };

const TIMEOUT_MS = 45_000;

/** Admin-supplied base URLs must be public HTTPS endpoints (basic SSRF guard). */
export function assertSafeBaseUrl(raw: string): URL {
  let u: URL;
  try { u = new URL(raw); } catch { throw new Error("Base URL is not a valid URL."); }
  // Local development only (never in production): allow a mock server on localhost for testing.
  if (process.env.NODE_ENV !== "production" && process.env.AI_DEV_ALLOW_LOCAL === "1") return u;
  if (u.protocol !== "https:") throw new Error("Base URL must use https.");
  const h = u.hostname.toLowerCase();
  const privateV4 = /^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || privateV4.test(h) || h === "[::1]" || h.startsWith("[fc") || h.startsWith("[fd") || h.startsWith("[fe80")) {
    throw new Error("Base URL must be a public host.");
  }
  if (u.username || u.password) throw new Error("Base URL must not contain credentials.");
  return u;
}

async function post(url: string, headers: Record<string, string>, body: unknown) {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: "error",
    });
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new Error(timedOut ? "The provider took too long to respond." : "Could not reach the provider (network error).");
  }
  const raw = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(raw); } catch { /* non-JSON error body */ }
  if (!res.ok) {
    const j = json as { error?: { message?: string } | string; message?: string } | null;
    const msg = (typeof j?.error === "string" ? j.error : j?.error?.message) || j?.message || raw.slice(0, 200) || res.statusText;
    throw new Error(`HTTP ${res.status}: ${String(msg).slice(0, 300)}`);
  }
  return json as Record<string, unknown>;
}

export async function callProvider(
  type: ProviderType,
  cfg: { apiKey: string; model: string; baseUrl?: string },
  req: LlmRequest,
): Promise<LlmResult> {
  const maxTokens = req.maxTokens ?? 1024;
  const temperature = req.temperature ?? 0.3;

  if (type === "openai") {
    const base = assertSafeBaseUrl(cfg.baseUrl ?? "").toString().replace(/\/+$/, "");
    const messages = [...(req.system ? [{ role: "system", content: req.system }] : []), { role: "user", content: req.prompt }];
    const j = (await post(`${base}/chat/completions`, { authorization: `Bearer ${cfg.apiKey}` }, {
      model: cfg.model, messages, max_tokens: maxTokens, temperature,
    })) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
    const text = j.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty reply. This looks like a reasoning model that used its whole token budget thinking; pick a non-reasoning model or raise the limit.");
    return { text, inputTokens: j.usage?.prompt_tokens, outputTokens: j.usage?.completion_tokens };
  }

  if (type === "anthropic") {
    const j = (await post("https://api.anthropic.com/v1/messages", { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" }, {
      model: cfg.model, max_tokens: maxTokens, temperature, ...(req.system ? { system: req.system } : {}),
      messages: [{ role: "user", content: req.prompt }],
    })) as { content?: { type: string; text?: string }[]; usage?: { input_tokens?: number; output_tokens?: number } };
    const text = j.content?.filter((c) => c.type === "text").map((c) => c.text).join("") ?? "";
    if (!text) throw new Error("Empty response from provider.");
    return { text, inputTokens: j.usage?.input_tokens, outputTokens: j.usage?.output_tokens };
  }

  const j = (await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cfg.model)}:generateContent`,
    { "x-goog-api-key": cfg.apiKey },
    {
      ...(req.system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
      contents: [{ role: "user", parts: [{ text: req.prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    },
  )) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } };
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Empty response from provider.");
  return { text, inputTokens: j.usageMetadata?.promptTokenCount, outputTokens: j.usageMetadata?.candidatesTokenCount };
}

/** Lists model ids the key can actually use, so the admin never has to guess a model name. */
export async function listModels(type: ProviderType, cfg: { apiKey: string; baseUrl?: string }): Promise<string[]> {
  let url: string;
  let headers: Record<string, string>;
  if (type === "openai") {
    url = `${assertSafeBaseUrl(cfg.baseUrl ?? "").toString().replace(/\/+$/, "")}/models`;
    headers = { authorization: `Bearer ${cfg.apiKey}` };
  } else if (type === "anthropic") {
    url = "https://api.anthropic.com/v1/models?limit=100";
    headers = { "x-api-key": cfg.apiKey, "anthropic-version": "2023-06-01" };
  } else {
    url = "https://generativelanguage.googleapis.com/v1beta/models?pageSize=200";
    headers = { "x-goog-api-key": cfg.apiKey };
  }
  let res: Response;
  try {
    res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000), redirect: "error" });
  } catch {
    throw new Error("Could not reach the provider to list models.");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: could not list models (check the API key).`);
  const j = (await res.json()) as { data?: { id: string }[]; models?: { name: string; supportedGenerationMethods?: string[] }[] };
  const ids = type === "gemini"
    ? (j.models ?? []).filter((m) => m.supportedGenerationMethods?.includes("generateContent")).map((m) => m.name.replace(/^models\//, ""))
    : (j.data ?? []).map((m) => m.id);
  return ids.filter((id) => !/embed|whisper|tts|moderation|guard|image|audio|transcribe/i.test(id)).sort();
}
