import type { Metadata } from "next";
import { DraftNotice, PageHeader, Prose } from "@/components/marketing/blocks";
import { legal, legalComplete } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Terms() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Service" />
      <Prose>
        {!legalComplete && <DraftNotice />}
        <p>Operator: {legal.owner || "[Your Name / Company]"}, {legal.country || "[Country]"}. Last updated: {legal.updated}.</p>
        <h2>The service</h2>
        <p>CareerPilot AI helps you analyse your CV, discover jobs, understand skill gaps, and prepare application drafts. You send all applications yourself. We never apply for you.</p>
        <h2>No guarantees</h2>
        <ul>
          <li>Match scores, drafts and roadmaps are AI-generated guidance, not a prediction of hiring or a guarantee of any outcome. They can contain mistakes: check every fact before you use it.</li>
          <li>We do not guarantee that a job is real, active or available. Verify every job on its original source before applying, and never pay money to get a job.</li>
          <li>The service is provided as is and may change or be unavailable at times.</li>
        </ul>
        <h2>Acceptable use</h2>
        <ul>
          <li>Upload only your own CV, or one you are authorised to use.</li>
          <li>No abuse, automated scraping of this service, attempts to break its security, or illegal content.</li>
          <li>We may suspend or delete accounts that break these rules.</li>
        </ul>
        <h2>Your content</h2>
        <p>You keep ownership of your content. You allow us to process it, including by sending it to an AI provider, to provide the service.</p>
        <h2>Third-party jobs</h2>
        <p>Job listings belong to their original publishers and are linked to their source. We are not the employer or recruiter for any listing.</p>
        <h2>Limitation of liability</h2>
        <p>To the extent permitted by law, the operator is not liable for losses arising from your use of the service or from decisions you make based on AI output or job listings.</p>
        <h2>Contact</h2>
        <p>{legal.email || "[Contact Email]"}</p>
      </Prose>
    </>
  );
}
