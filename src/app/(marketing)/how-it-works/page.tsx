import type { Metadata } from "next";
import { FinalCta, PageHeader, Section } from "@/components/marketing/blocks";
import { Card } from "@/components/ui/primitives";
import { STEPS } from "@/lib/content";

export const metadata: Metadata = { title: "How it works" };

export default function HowItWorks() {
  return (
    <>
      <PageHeader eyebrow="How it works" title="Five steps from CV to application">Nothing leaves your account without your approval.</PageHeader>
      <Section>
        <ol className="mx-auto max-w-3xl space-y-4">
          {STEPS.map((s) => (
            <li key={s.n}><Card className="flex gap-5"><span className="font-display text-4xl font-extrabold text-gradient">{s.n}</span><div><h3 className="text-lg font-bold">{s.title}</h3><p className="mt-1 text-sm text-muted">{s.body}</p></div></Card></li>
          ))}
        </ol>
      </Section>
      <FinalCta />
    </>
  );
}
