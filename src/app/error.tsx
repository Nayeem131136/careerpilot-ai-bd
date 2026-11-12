"use client";
import { useEffect } from "react";
import { reportClientError } from "@/lib/errors/report-client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportClientError(error); }, [error]);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted">This page could not load. Your data is safe. Please try again.</p>
      <button type="button" onClick={reset} className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
    </main>
  );
}
