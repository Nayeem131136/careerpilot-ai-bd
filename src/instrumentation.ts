import type { Instrumentation } from "next";

/** Records every unhandled server error (page render, route handler, server action) for the admin Errors page. */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const e = err as { message?: string; stack?: string; digest?: string };
  const { logError } = await import("@/lib/errors/log");
  await logError({ source: "server", message: e?.message ?? String(err), stack: e?.stack, digest: e?.digest, path: request.path, routeType: context.routeType });
};
