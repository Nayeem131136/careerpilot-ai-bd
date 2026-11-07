import type { Metadata } from "next";
import { Check } from "lucide-react";
import { FinalCta, PageHeader, Section } from "@/components/marketing/blocks";
import { Card, Badge } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pricing" };

const included = ["CV upload and AI analysis", "Career discovery from your CV", "Job matching with explanations", "Application drafts (you send them)", "Application tracker", "Skill gap roadmaps", "Export and delete your data"];

export default function Pricing() {
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Free during the beta">No credit card. Fair-use limits apply because AI and infrastructure have real quotas.</PageHeader>
      <Section>
        <Card className="mx-auto max-w-lg">
          <div className="flex items-center justify-between"><h2 className="font-display text-2xl font-bold">Free</h2><Badge>Beta</Badge></div>
          <p className="mt-2 text-sm text-muted">Everything you need to find and prepare for your next role.</p>
          <ul className="mt-5 space-y-2.5">{included.map((i) => <li key={i} className="flex items-center gap-2 text-sm"><Check size={16} className="text-success" />{i}</li>)}</ul>
          <ButtonLink href="/register" className="mt-6 w-full">Create a free account</ButtonLink>
          <p className="mt-4 text-xs text-muted">Plans may change after the beta. We will tell you before anything changes.</p>
        </Card>
      </Section>
      <FinalCta />
    </>
  );
}
