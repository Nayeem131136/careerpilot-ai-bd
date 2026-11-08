import "server-only";
import { z } from "zod";

/**
 * Central, validated environment access (server only).
 * Secrets never reach the browser: only NEXT_PUBLIC_* values are bundled client-side.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_PROJECT_PRODUCTION_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  MASTER_ENCRYPTION_SECRET: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_APP_KEY: z.string().optional(),
  JOOBLE_API_KEY: z.string().optional(),
});

const parsed = schema.parse(process.env);
const isProd = parsed.NODE_ENV === "production";

export const env = parsed;

export const appUrl: string = (() => {
  if (parsed.BETTER_AUTH_URL) return parsed.BETTER_AUTH_URL;
  if (parsed.NEXT_PUBLIC_APP_URL) return parsed.NEXT_PUBLIC_APP_URL;
  if (parsed.VERCEL_PROJECT_PRODUCTION_URL && isProd) return `https://${parsed.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (parsed.VERCEL_URL) return `https://${parsed.VERCEL_URL}`;
  return "http://localhost:3000";
})();

/** Auth secret: required in production, generated dev-only fallback otherwise. */
export const authSecret: string | undefined =
  parsed.BETTER_AUTH_SECRET && parsed.BETTER_AUTH_SECRET.length >= 32
    ? parsed.BETTER_AUTH_SECRET
    : isProd
      ? undefined
      : "dev-only-secret-change-me-dev-only-secret-0123456789";

/** Comma-separated emails that are promoted to admin on sign-in (server-side only). */
export const adminEmails: string[] = (parsed.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const features = {
  database: Boolean(parsed.DATABASE_URL) || !isProd, // local PGlite only in dev
  authSecretOk: Boolean(authSecret),
  google: Boolean(parsed.GOOGLE_CLIENT_ID && parsed.GOOGLE_CLIENT_SECRET),
  github: Boolean(parsed.GITHUB_CLIENT_ID && parsed.GITHUB_CLIENT_SECRET),
  linkedin: Boolean(parsed.LINKEDIN_CLIENT_ID && parsed.LINKEDIN_CLIENT_SECRET),
  email: Boolean(parsed.RESEND_API_KEY && parsed.EMAIL_FROM),
  blob: Boolean(parsed.BLOB_READ_WRITE_TOKEN),
  encryptionSecret: Boolean(parsed.MASTER_ENCRYPTION_SECRET && parsed.MASTER_ENCRYPTION_SECRET.length >= 32),
};
