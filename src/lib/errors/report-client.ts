/** Sends a browser crash to the site's own error log. Fire-and-forget; failures are ignored. */
export function reportClientError(error: Error & { digest?: string }) {
  try {
    void fetch("/api/errors/report", { method: "POST", keepalive: true, headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: error?.message ?? "Unknown error", digest: error?.digest, path: window.location.pathname, stack: error?.stack?.slice(0, 2500) }) }).catch(() => {});
  } catch { /* ignore */ }
}
