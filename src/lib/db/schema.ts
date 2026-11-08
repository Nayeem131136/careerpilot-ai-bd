import {
  pgTable, text, boolean, timestamp, integer, bigint, uuid, jsonb, index, uniqueIndex,
} from "drizzle-orm/pg-core";

/* ---------- Better Auth core tables ---------- */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"), // 'user' | 'admin' | 'super_admin' (set server-side only)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (t) => [index("session_user_idx").on(t.userId)]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("account_user_idx").on(t.userId)]);

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Persistent rate limiting (works on serverless, unlike in-memory). */
export const rateLimit = pgTable("rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

/* ---------- Product tables (Phase 1 foundation) ---------- */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  headline: text("headline"),
  country: text("country"),
  city: text("city"),
  portfolioUrl: text("portfolio_url"),
  linkedinUrl: text("linkedin_url"),
  githubUrl: text("github_url"),
  websiteUrl: text("website_url"),
  education: jsonb("education"),
  experienceLevel: text("experience_level"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("profiles_user_uidx").on(t.userId)]);

export const careerPreferences = pgTable("career_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  jobCategories: jsonb("job_categories").$type<string[]>(),
  jobTitles: jsonb("job_titles").$type<string[]>(),
  countries: jsonb("countries").$type<string[]>(),
  cities: jsonb("cities").$type<string[]>(),
  workArrangements: jsonb("work_arrangements").$type<string[]>(),
  employmentTypes: jsonb("employment_types").$type<string[]>(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency"),
  visaSponsorship: boolean("visa_sponsorship"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("prefs_user_uidx").on(t.userId)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  target: text("target"),
  meta: jsonb("meta"), // never store secrets here
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("audit_actor_idx").on(t.actorId)]);

/* ---------- AI Control Center (Phase 2) ---------- */
export const aiProviders = pgTable("ai_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerKey: text("provider_key").notNull(), // e.g. openai, anthropic, gemini, groq, custom
  label: text("label").notNull(),
  apiKeyEnc: text("api_key_enc").notNull(), // AES-256-GCM, never returned to the client
  keyLast4: text("key_last4").notNull(),
  baseUrl: text("base_url"),
  model: text("model").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  lastTestAt: timestamp("last_test_at"),
  lastTestOk: boolean("last_test_ok"),
  lastTestMsg: text("last_test_msg"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("ai_providers_key_uidx").on(t.providerKey)]);

export const aiSettings = pgTable("ai_settings", {
  id: text("id").primaryKey(), // always 'global'
  primaryProviderId: uuid("primary_provider_id").references(() => aiProviders.id, { onDelete: "set null" }),
  fallbackProviderId: uuid("fallback_provider_id").references(() => aiProviders.id, { onDelete: "set null" }),
  routing: jsonb("routing").$type<Record<string, { providerId?: string; model?: string }>>().notNull().default({}),
  dailyUserLimit: integer("daily_user_limit").notNull().default(50),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const aiUsage = pgTable("ai_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  task: text("task").notNull(),
  providerKey: text("provider_key").notNull(),
  model: text("model").notNull(),
  ok: boolean("ok").notNull(),
  latencyMs: integer("latency_ms"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("ai_usage_created_idx").on(t.createdAt), index("ai_usage_user_idx").on(t.userId, t.createdAt)]);

/* ---------- CV (Phase 3) ---------- */
export const cvs = pgTable("cvs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  fileName: text("file_name"),
  sourceType: text("source_type").notNull(), // 'upload' | 'paste'
  rawText: text("raw_text").notNull(),
  parsed: jsonb("parsed"), // validated CvAnalysis (see lib/cv/schema.ts)
  language: text("language"), // en | bn | mixed
  status: text("status").notNull().default("pending"), // pending | analyzed | failed
  error: text("error"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("cvs_user_uidx").on(t.userId)]);
