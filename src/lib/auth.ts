import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "@/lib/db";
import { env, appUrl, authSecret, features } from "@/lib/env";

async function sendEmail(to: string, subject: string, html: string) {
  if (!features.email) throw new Error("Email service is not configured.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Email provider error (${res.status}).`);
}

function build() {
  if (!authSecret) {
    throw new Error("BETTER_AUTH_SECRET (min 32 chars) is not set. See DEPLOY.md.");
  }
  const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
  if (features.google) socialProviders.google = { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET! };
  if (features.github) socialProviders.github = { clientId: env.GITHUB_CLIENT_ID!, clientSecret: env.GITHUB_CLIENT_SECRET! };
  if (features.linkedin) socialProviders.linkedin = { clientId: env.LINKEDIN_CLIENT_ID!, clientSecret: env.LINKEDIN_CLIENT_SECRET! };

  const trusted = [appUrl];
  if (env.VERCEL_URL) trusted.push(`https://${env.VERCEL_URL}`);

  return betterAuth({
    appName: "CareerPilot AI",
    baseURL: appUrl,
    secret: authSecret,
    trustedOrigins: trusted,
    database: drizzleAdapter(db, { provider: "pg", schema: { ...schema, rateLimit: schema.rateLimit } }),
    rateLimit: { enabled: true, storage: "database", modelName: "rateLimit", window: 60, max: 60 },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      // Verification is enforced only when an email provider is configured (otherwise nobody could sign in).
      requireEmailVerification: features.email,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail(user.email, "Reset your CareerPilot AI password", `<p>Reset your password: <a href="${url}">${url}</a></p><p>If you did not request this, ignore this email.</p>`);
      },
    },
    emailVerification: {
      sendOnSignUp: features.email,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail(user.email, "Verify your CareerPilot AI email", `<p>Verify your email: <a href="${url}">${url}</a></p>`);
      },
    },
    socialProviders,
    user: {
      additionalFields: { role: { type: "string", defaultValue: "user", input: false } },
      deleteUser: { enabled: true },
    },
    session: { expiresIn: 60 * 60 * 24 * 14, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 60 * 5 } },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof build>;
const g = globalThis as unknown as { __cpAuth?: Auth };

/** Lazy so that builds succeed even when secrets are not yet configured. */
export function getAuth(): Auth {
  return (g.__cpAuth ??= build());
}
