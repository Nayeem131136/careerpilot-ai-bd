"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";

export function DeleteAccount({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setBusy(true);
    setError("");
    const { error: err } = await authClient.deleteUser(hasPassword ? { password } : {});
    setBusy(false);
    if (err) return setError(err.message || "Could not delete the account. Please try again.");
    router.push("/");
    router.refresh();
  }

  if (!open) return <Button variant="danger" onClick={() => setOpen(true)}>Delete my account</Button>;
  return (
    <form onSubmit={onSubmit} className="max-w-sm space-y-3 rounded-xl border border-danger/50 p-4">
      <p className="text-sm">This permanently deletes your account and the data linked to it. It cannot be undone.</p>
      {hasPassword && <Field label="Confirm with your password" htmlFor="password" error={error}><Input id="password" name="password" type="password" autoComplete="current-password" required /></Field>}
      {!hasPassword && error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="danger" disabled={busy}>{busy ? "Deleting…" : "Yes, delete"}</Button>
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
