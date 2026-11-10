import { z } from "zod";

export const LEVELS = [
  { key: "hsc", label: "After HSC / school" },
  { key: "bachelor", label: "Bachelor's" },
  { key: "master", label: "Master's" },
  { key: "phd", label: "PhD" },
] as const;
export type Level = (typeof LEVELS)[number]["key"];
export const LEVEL_KEYS = LEVELS.map((l) => l.key) as [Level, ...Level[]];
export const levelLabel = (k: string) => LEVELS.find((l) => l.key === k)?.label ?? k;

const list = (max: number, len = 120) => z.array(z.string().trim().min(1).max(len)).max(max);

export const scholarshipInput = z.object({
  name: z.string().trim().min(3).max(160),
  provider: z.string().trim().min(2).max(160),
  hostCountry: z.string().trim().min(2).max(80),
  universities: list(30),
  levels: z.array(z.enum(LEVEL_KEYS)).min(1, "Choose at least one study level."),
  fields: list(20, 60),
  funding: z.enum(["full", "partial"]),
  coverage: z.string().trim().max(700),
  eligibility: z.string().trim().max(900),
  bangladeshEligible: z.enum(["yes", "check"]),
  language: z.string().trim().max(200),
  howToApply: z.string().trim().max(900),
  deadlineText: z.string().trim().max(200),
  deadlineDate: z.string().trim().max(10).regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use a date like 2026-12-31.").optional().default(""),
  officialUrl: z.string().trim().url().max(500).refine((u) => u.startsWith("https://"), "The official link must start with https://"),
});
export type ScholarshipInput = z.infer<typeof scholarshipInput>;

/** Comma/line separated text to a clean list. */
export const toList = (s: string) => [...new Set(s.split(/[,\n;]/).map((x) => x.trim()).filter(Boolean))];

/** An admin has not re-confirmed the details for this long: show the "check the official page" nudge. */
export const STALE_DAYS = 90;
