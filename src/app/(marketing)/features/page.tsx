import type { Metadata } from "next";
import { FinalCta, PageHeader, Section } from "@/components/marketing/blocks";
import { Card } from "@/components/ui/primitives";
import { EXCLUSIVE, FEATURES } from "@/lib/content";

export const metadata: Metadata = { title: "Features" };

export default function Features() {
  return (
    <>
      <PageHeader eyebrow="Features" title={<>Built around your <span className="text-gradient">CV</span></>}>
        A complete workspace that takes you from understanding your strengths to tracking your applications.
      </PageHeader>
      <Section title="Core">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => <Card key={f.title}><h3 className="font-display text-lg font-bold">{f.title}</h3><p className="mt-2 text-sm text-muted">{f.body}</p></Card>)}
        </div>
      </Section>
      <Section title="Built-in safeguards">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EXCLUSIVE.map((f) => <Card key={f.title}><h3 className="font-display text-lg font-bold">{f.title}</h3><p className="mt-2 text-sm text-muted">{f.body}</p></Card>)}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
