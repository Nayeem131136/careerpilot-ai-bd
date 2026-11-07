import type { Metadata } from "next";
import { FinalCta, PageHeader, Section } from "@/components/marketing/blocks";
import { Card, Badge } from "@/components/ui/primitives";
import { CATEGORIES } from "@/lib/content";

export const metadata: Metadata = { title: "Job categories" };

export default function JobCategories() {
  return (
    <>
      <PageHeader eyebrow="Job categories" title="Every field, not just IT">Onsite, remote or hybrid. Internships to full-time. These are examples, and AI can discover roles beyond this list.</PageHeader>
      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Card key={c.name}><h3 className="font-display text-lg font-bold">{c.name}</h3><div className="mt-3 flex flex-wrap gap-2">{c.roles.map((r) => <Badge key={r}>{r}</Badge>)}</div></Card>
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
