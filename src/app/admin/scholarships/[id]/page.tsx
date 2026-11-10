import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { ScholarshipForm, type FormValues } from "@/components/admin/scholarship-form";
import { db, schema } from "@/lib/db";

export const metadata = { title: "Admin: edit scholarship" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [r] = await db.select().from(schema.scholarships).where(eq(schema.scholarships.id, id));
  if (!r) notFound();
  const initial: FormValues = {
    name: r.name, provider: r.provider, hostCountry: r.hostCountry, universities: r.universities.join(", "), levels: r.levels, fields: r.fields.join(", "),
    funding: r.funding === "partial" ? "partial" : "full", coverage: r.coverage, eligibility: r.eligibility, bangladeshEligible: r.bangladeshEligible === "yes" ? "yes" : "check",
    language: r.language, howToApply: r.howToApply, deadlineText: r.deadlineText, deadlineDate: r.deadlineDate ? r.deadlineDate.toISOString().slice(0, 10) : "", officialUrl: r.officialUrl,
  };
  return (
    <div className="space-y-6">
      <div><Link href="/admin/scholarships" className="text-sm text-primary hover:underline">← Scholarships</Link><h1 className="mt-1 text-2xl font-extrabold">Check and edit</h1>
        <p className="mt-1 text-sm text-muted">Status: <b>{r.status}</b>{r.origin === "ai" ? " · filled by AI, check every field" : ""}. <a href={r.officialUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open the official page</a> and compare.</p></div>
      <ScholarshipForm id={r.id} initial={initial} />
    </div>
  );
}
