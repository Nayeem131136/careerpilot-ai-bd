import { eq } from "drizzle-orm";
import { OnboardingForm } from "@/components/app/onboarding-form";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Your profile" };

export default async function OnboardingPage() {
  const s = await requireSession();
  const [p] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, s.user.id));
  const [c] = await db.select().from(schema.careerPreferences).where(eq(schema.careerPreferences.userId, s.user.id));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Tell us about your goals</h1>
        <p className="mt-1 text-sm text-muted">This helps us find relevant jobs. Everything is optional and you can change it any time.</p>
      </div>
      <OnboardingForm initial={{
        headline: p?.headline ?? "", country: p?.country ?? "", city: p?.city ?? "", experienceLevel: (p?.experienceLevel as never) ?? null,
        portfolioUrl: p?.portfolioUrl ?? "", linkedinUrl: p?.linkedinUrl ?? "", githubUrl: p?.githubUrl ?? "",
        jobCategories: c?.jobCategories ?? [], countries: c?.countries ?? [], workArrangements: c?.workArrangements ?? [], employmentTypes: c?.employmentTypes ?? [],
        jobTitles: c?.jobTitles ?? [], visaSponsorship: c?.visaSponsorship ?? false,
        salaryMin: c?.salaryMin ?? null, salaryMax: c?.salaryMax ?? null, salaryCurrency: c?.salaryCurrency ?? "",
      }} />
    </div>
  );
}
