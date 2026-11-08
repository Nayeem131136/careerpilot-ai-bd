import "server-only";

const MAX_BYTES = 6 * 1024 * 1024;
const UA = "CareerPilotAI/1.0 (job discovery; contact via site admin)";

/** Dev-only: JOBS_MOCK_BASE redirects every source to a local mock server (never in production). */
function target(url: string): string {
  const mock = process.env.NODE_ENV !== "production" ? process.env.JOBS_MOCK_BASE : undefined;
  if (!mock) return url;
  const u = new URL(url);
  return `${mock.replace(/\/$/, "")}/${u.host}${u.pathname}${u.search}`;
}

export async function fetchJson(url: string, init?: { method?: "GET" | "POST"; headers?: Record<string, string>; body?: unknown }): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(target(url), {
      method: init?.method ?? "GET",
      headers: { accept: "application/json", "user-agent": UA, ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch (e) {
    throw new Error(e instanceof Error && e.name === "TimeoutError" ? "timed out" : "network error");
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) throw new Error("response too large");
  const text = await res.text();
  if (text.length > MAX_BYTES) throw new Error("response too large");
  try { return JSON.parse(text); } catch { throw new Error("invalid JSON"); }
}
