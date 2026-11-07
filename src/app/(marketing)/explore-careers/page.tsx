import type { Metadata } from "next";
import { FinalCta, PageHeader, Section } from "@/components/marketing/blocks";
import { Card, Badge } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Explore careers" };

const paths = [
  { from: "English graduate", to: ["Content Specialist", "Research Assistant", "Customer Success"], via: "writing, research, communication" },
  { from: "BBA graduate", to: ["Business Analyst", "Operations Executive", "Sales Executive"], via: "analysis, planning, stakeholder skills" },
  { from: "CSE graduate", to: ["Software Engineer", "QA Engineer", "IT Support", "Data Analyst"], via: "programming, problem solving, systems" },
];

export default function ExploreCareers() {
  return (
    <>
      <PageHeader eyebrow="Explore careers" title={<>Careers your CV <span className="text-gradient">points to</span></>}>
        You do not need to know the right job title. AI reads your strengths and shows paths, including ones you did not write down.
      </PageHeader>
      <Section title="How discovery thinks" sub="Illustrative examples of transferable-skill paths. Your own results come from your own CV.">
        <div className="grid gap-4 md:grid-cols-3">
          {paths.map((p) => (
            <Card key={p.from}>
              <Badge tone="warn">Illustrative</Badge>
              <h3 className="mt-3 font-display text-lg font-bold">{p.from}</h3>
              <p className="mt-1 text-xs text-muted">Strengths: {p.via}</p>
              <div className="mt-4 flex flex-wrap gap-2">{p.to.map((t) => <Badge key={t}>{t}</Badge>)}</div>
            </Card>
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
