"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/primitives";

export type Providers = { google: boolean; github: boolean; linkedin: boolean };

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(128);

function errMap(issues: z.ZodIssue[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}

function SocialButtons({ providers }: { providers: Providers }) {
  const list = (["google", "github", "linkedin"] as const).filter((p) => providers[p]);
  if (list.length === 0) return null;
  return (
    <>
      <div className="grid gap-2">
        {list.map((p) => (
          <Button key={p} type="button" variant="secondary" onClick={() => authClient.signIn.social({ provider: p, callbackURL: "/dashboard" })}>
            Continue with {p === "github" ? "GitHub" : p === "linkedin" ? "LinkedIn" : "Google"}
          </Button>
        ))}
      </div>
      <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
    </>
  );
}

function Notice({ tone, children }: { tone: "danger" | "success" | "warn"; children: React.ReactNode }) {
  const c = { danger: "border-danger/50 bg-danger/10", success: "border-success/50 bg-success/10", warn: "border-warn/50 bg-warn/10" }[tone];
  return <div role={tone === "danger" ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${c}`}>{children}</div>;
}

export function LoginForm({ providers }: { providers: Providers }) {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next");
  const suspended = sp.get("suspended") === "1";
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const parsed = z.object({ email: emailSchema, password: z.string().min(1, "Enter your password.") }).safeParse(Object.fromEntries(fd));
    if (!parsed.success) return setErrors(errMap(parsed.error.issues));
    setErrors({});
    setBusy(true);
    const { error } = await authClient.signIn.email(parsed.data);
    setBusy(false);
    if (error) return setFormError(error.status === 403 ? "Please verify your email first. Check your inbox." : error.message || "Could not sign in. Check your email and password.");
    router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Log in to continue to your dashboard.</p>
      <div className="mt-6"><SocialButtons providers={providers} /></div>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {suspended && <Notice tone="danger">This account has been suspended. Contact the site admin if you think this is a mistake.</Notice>}
        {formError && <Notice tone="danger">{formError}</Notice>}
        <Field label="Email" htmlFor="email" error={errors.email}><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
        <Field label="Password" htmlFor="password" error={errors.password}><Input id="password" name="password" type="password" autoComplete="current-password" required /></Field>
        <div className="text-right text-sm"><Link href="/forgot-password" className="text-primary hover:underline">Forgot password?</Link></div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Log in"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New here? <Link href="/register" className="text-primary hover:underline">Create an account</Link></p>
    </div>
  );
}

export function RegisterForm({ providers, emailVerification }: { providers: Providers; emailVerification: boolean }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const parsed = z.object({
      name: z.string().trim().min(2, "Enter your name.").max(80),
      email: emailSchema,
      password: passwordSchema,
      consent: z.literal("on", { message: "Please accept the Terms and Privacy Policy." }),
    }).safeParse(Object.fromEntries(fd));
    if (!parsed.success) return setErrors(errMap(parsed.error.issues));
    setErrors({});
    setBusy(true);
    const { name, email, password } = parsed.data;
    const { error } = await authClient.signUp.email({ name, email, password, callbackURL: "/dashboard" });
    setBusy(false);
    if (error) return setFormError(error.message || "Could not create the account.");
    if (emailVerification) return setSent(true);
    router.push("/dashboard");
    router.refresh();
  }

  if (sent) return <Notice tone="success"><strong>Check your inbox.</strong> We sent a verification link. Click it to finish creating your account.</Notice>;

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Create your account</h1>
      <p className="mt-2 text-sm text-muted">Free during the beta. You always send applications yourself.</p>
      <div className="mt-6"><SocialButtons providers={providers} /></div>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <Notice tone="danger">{formError}</Notice>}
        <Field label="Full name" htmlFor="name" error={errors.name}><Input id="name" name="name" autoComplete="name" required /></Field>
        <Field label="Email" htmlFor="email" error={errors.email}><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
        <Field label="Password" htmlFor="password" error={errors.password}><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
        <div>
          <label className="flex items-start gap-2.5 text-sm"><input type="checkbox" name="consent" className="mt-1 h-4 w-4 accent-[var(--primary)]" /> <span>I agree to the <Link href="/terms" className="text-primary underline">Terms</Link> and <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.</span></label>
          {errors.consent && <p role="alert" className="mt-1 text-xs text-danger">{errors.consent}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link></p>
    </div>
  );
}

export function ForgotPasswordForm({ emailConfigured }: { emailConfigured: boolean }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(new FormData(e.currentTarget).get("email"));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setError("");
    setBusy(true);
    await authClient.requestPasswordReset({ email: parsed.data, redirectTo: "/reset-password" });
    setBusy(false);
    setDone(true); // same message whether or not the account exists
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Reset your password</h1>
      {!emailConfigured && <div className="mt-5"><Notice tone="warn">Password reset email is not configured on this deployment yet, so reset links cannot be sent. The site owner needs to set up the email service (see DEPLOY.md).</Notice></div>}
      {done ? (
        <div className="mt-5"><Notice tone="success">If an account exists for that email, a reset link is on its way.</Notice></div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <Field label="Email" htmlFor="email" error={error}><Input id="email" name="email" type="email" autoComplete="email" required /></Field>
          <Button type="submit" className="w-full" disabled={busy || !emailConfigured}>{busy ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted"><Link href="/login" className="text-primary hover:underline">Back to log in</Link></p>
    </div>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(new FormData(e.currentTarget).get("password"));
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (!token) return setError("This reset link is invalid or has expired.");
    setError("");
    setBusy(true);
    const { error: err } = await authClient.resetPassword({ newPassword: parsed.data, token });
    setBusy(false);
    if (err) return setError(err.message || "This reset link is invalid or has expired.");
    router.push("/login");
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Choose a new password</h1>
      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <Field label="New password" htmlFor="password" error={error}><Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
      </form>
    </div>
  );
}
