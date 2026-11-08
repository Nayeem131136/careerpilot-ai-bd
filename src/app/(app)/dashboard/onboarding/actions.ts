"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { ARRANGEMENTS, CATEGORIES, COUNTRIES, EMPLOYMENT } from "@/lib/options";
import { LEVELS } from "@/lib/cv/schema";
import { getSession } from "@/lib/session";

const pick = (allowed: readonly string[]) => z.array(z.string().refine((v) => allowed.includes(v))).max(30);
const text = (n: number) => z.string().trim().max(n);
const url = z.string().trim().max(200).refine((v) => v === "" || /^https?:\/\//i.test(v), "Links must start with http:// or https://");

const schemaIn = z.object({
  headline: text(160), country: text(80), city: text(80),
  experienceLevel: z.enum(LEVELS).nullable(),
  portfolioUrl: url, linkedinUrl: url, githubUrl: url,
  jobCategories: pick(CATEGORIES), countries: pick(COUNTRIES), workArrangements: pick(ARRANGEMENTS), employmentTypes: pick(EMPLOYMENT),
  jobTitles: z.array(text(80).min(1)).max(10),
  visaSponsorship: z.boolean(),
  salaryMin: z.number().int().min(0).max(1e9).nullable(), salaryMax: z.number().int().min(0).max(1e9).nullable(), salaryCurrency: text(5),
});
export type OnboardingInput = z.input<typeof schemaIn>;

export async function saveOnboarding(input: OnboardingInput): Promise<{ ok: boolean; message: string }> {
  const s = await getSession();
  if (!s) return { ok: false, message: "Please sign in again." };
  const d = schemaIn.safeParse(input);
  if (!d.success) return { ok: false, message: d.error.issues[0]?.message ?? "Please check the form." };
  const v = d.data;
  if (v.salaryMin != null && v.salaryMax != null && v.salaryMin > v.salaryMax) return { ok: false, message: "Minimum salary cannot be above the maximum." };
  const n = (x: string) => x || null;
  const profile = { headline: n(v.headline), country: n(v.country), city: n(v.city), experienceLevel: v.experienceLevel, portfolioUrl: n(v.portfolioUrl), linkedinUrl: n(v.linkedinUrl), githubUrl: n(v.githubUrl), onboardingCompleted: true, updatedAt: new Date() };
  await db.insert(schema.profiles).values({ userId: s.user.id, ...profile }).onConflictDoUpdate({ target: schema.profiles.userId, set: profile });
  const prefs = { jobCategories: v.jobCategories, jobTitles: v.jobTitles, countries: v.countries, workArrangements: v.workArrangements, employmentTypes: v.employmentTypes, visaSponsorship: v.visaSponsorship, salaryMin: v.salaryMin, salaryMax: v.salaryMax, salaryCurrency: n(v.salaryCurrency), updatedAt: new Date() };
  await db.insert(schema.careerPreferences).values({ userId: s.user.id, ...prefs }).onConflictDoUpdate({ target: schema.careerPreferences.userId, set: prefs });
  revalidatePath("/dashboard");
  return { ok: true, message: "Saved." };
}
