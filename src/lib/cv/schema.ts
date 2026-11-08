import { z } from "zod";

const str = (max: number) => z.string().trim().max(max);
const list = (max: number, item = 80) => z.array(str(item).min(1)).max(max);

export const LEVELS = ["student", "entry", "mid", "senior", "lead"] as const;

/** The only shape the app trusts from the AI (and from user edits). */
export const cvAnalysisSchema = z.object({
  fullName: str(120).nullish().transform((v) => v || null),
  headline: str(160).nullish().transform((v) => v || null),
  summary: str(1200).default(""),
  language: z.enum(["en", "bn", "mixed"]).catch("en"),
  experienceLevel: z.enum(LEVELS).nullish().catch(null).transform((v) => v ?? null),
  skills: list(60).default([]),
  careerFields: list(6, 60).default([]),
  languages: list(10, 40).default([]),
  certifications: list(15, 120).default([]),
  experience: z.array(z.object({
    title: str(120).default(""), company: str(120).default(""),
    start: str(30).nullish().transform((v) => v || null), end: str(30).nullish().transform((v) => v || null),
    description: str(800).default(""),
  })).max(15).default([]),
  projects: z.array(z.object({
    name: str(140).default(""), role: str(80).nullish().transform((v) => v || null),
    description: str(900).default(""), technologies: list(25, 50).default([]),
    url: str(300).nullish().transform((v) => v || null),
  })).max(15).default([]),
  education: z.array(z.object({
    degree: str(160).default(""), institution: str(160).default(""),
    year: str(30).nullish().transform((v) => v || null),
  })).max(8).default([]),
  suggestedRoles: z.array(z.object({ title: str(100).min(1), why: str(300).default("") })).max(8).default([]),
});
export type CvAnalysis = z.infer<typeof cvAnalysisSchema>;

/** User corrections: only these fields are editable on the review screen. */
export const cvEditSchema = z.object({
  headline: str(160).nullable(),
  summary: str(1200),
  experienceLevel: z.enum(LEVELS).nullable(),
  skills: list(60),
  careerFields: list(6, 60),
  suggestedRoles: z.array(z.object({ title: str(100).min(1), why: str(300) })).max(8),
});
