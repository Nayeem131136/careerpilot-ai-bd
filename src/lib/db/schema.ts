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
  banned: boolean("banned").notNull().default(false), // suspended by an admin (Phase 7)
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

/* ---------- Jobs (Phase 4) ---------- */
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: text("owner_user_id").references(() => user.id, { onDelete: "cascade" }), // null = shared public pool
  source: text("source").notNull(), // jobicy | arbeitnow | adzuna | jooble | greenhouse | lever | pasted
  externalId: text("external_id").notNull(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  country: text("country"),
  remote: boolean("remote"),
  jobType: text("job_type"),
  level: text("level"),
  description: text("description").notNull().default(""), // plain text, truncated
  url: text("url").notNull(),
  postedAt: timestamp("posted_at"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  salaryCurrency: text("salary_currency"),
  sector: text("sector"), // government | private | ngo | null (unknown)
  workMode: text("work_mode"), // onsite | hybrid | remote | home | null
  deadline: text("deadline"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  dedupeKey: text("dedupe_key").notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  uniqueIndex("jobs_source_ext_uidx").on(t.source, t.externalId),
  index("jobs_dedupe_idx").on(t.dedupeKey),
  index("jobs_posted_idx").on(t.postedAt),
  index("jobs_owner_idx").on(t.ownerUserId),
]);

export const jobFetchLog = pgTable("job_fetch_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  queryKey: text("query_key").notNull(),
  ok: boolean("ok").notNull(),
  count: integer("count").notNull().default(0),
  error: text("error"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
}, (t) => [index("job_fetch_log_idx").on(t.source, t.queryKey, t.fetchedAt)]);

export const companySources = pgTable("company_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  ats: text("ats").notNull(), // greenhouse | lever
  token: text("token").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  lastFetchAt: timestamp("last_fetch_at"),
  lastCount: integer("last_count"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("company_sources_uidx").on(t.ats, t.token)]);

export const userJobState = pgTable("user_job_state", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  state: text("state").notNull(), // saved | hidden
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("user_job_state_uidx").on(t.userId, t.jobId)]);

/** Public notice pages / RSS feeds (e.g. government job circulars) read by the shared crawler. */
export const pageSources = pgTable("page_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  kind: text("kind").notNull(), // rss | html
  sector: text("sector").notNull().default("government"),
  country: text("country"),
  enabled: boolean("enabled").notNull().default(true),
  lastFetchAt: timestamp("last_fetch_at"),
  lastCount: integer("last_count"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("page_sources_url_uidx").on(t.url)]);

/** AI-written match explanation for one user and one job (Phase 5). Cached; regenerated when the CV changes. */
export const jobMatches = pgTable("job_matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  data: jsonb("data").notNull(), // validated MatchResult (see lib/jobs/match.ts)
  cvUpdatedAt: timestamp("cv_updated_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("job_matches_uidx").on(t.userId, t.jobId)]);

/* ---------- Applications (Phase 6) ---------- */
/** One row per job the user is pursuing. Job details are copied in, so the row survives job clean-up. Nothing here is ever sent anywhere. */
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  jobUrl: text("job_url"),
  jobDescription: text("job_description").notNull().default(""),
  deadline: text("deadline"),
  status: text("status").notNull().default("interested"), // interested | drafting | applied | interview | offer | rejected | withdrawn
  appliedAt: timestamp("applied_at"),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("applications_user_job_uidx").on(t.userId, t.jobId), index("applications_user_idx").on(t.userId, t.updatedAt)]);

export const applicationDrafts = pgTable("application_drafts", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // cover_letter | email
  language: text("language").notNull(), // en | bn
  subject: text("subject").notNull().default(""),
  body: text("body").notNull(),
  instructions: text("instructions").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("application_drafts_app_idx").on(t.applicationId)]);

/* ---------- Skills & roadmap (Phase 8) ---------- */
export const roadmaps = pgTable("roadmaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  targetRole: text("target_role").notNull(),
  hoursPerWeek: integer("hours_per_week").notNull(),
  data: jsonb("data").notNull(), // validated Roadmap (see lib/roadmap/schema.ts)
  progress: jsonb("progress").notNull().default({}), // { [itemKey]: true }
  cvUpdatedAt: timestamp("cv_updated_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [uniqueIndex("roadmaps_user_uidx").on(t.userId)]);
