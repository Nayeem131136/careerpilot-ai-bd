import type { Metadata } from "next";
import { DraftNotice, PageHeader, Prose } from "@/components/marketing/blocks";

export const metadata: Metadata = { title: "Terms of Service" };

export default function Terms() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms of Service" />
      <Prose>
        <DraftNotice />
        <p>Operator: [Your Name / Company], [Country]. Last updated: [Date].</p>
        <h2>The service</h2>
        <p>CareerPilot AI helps you analyse your CV, discover jobs, and prepare application drafts. You send all applications yourself.</p>
        <h2>No guarantees</h2>
        <ul>
          <li>Match scores and AI output are guidance, not a prediction of hiring or a guarantee of any outcome.</li>
          <li>We do not guarantee that a job is real, active or available. Verify every job before applying, and never pay money to get a job.</li>
        </ul>
        <h2>Acceptable use</h2>
        <ul>
          <li>Upload only your own CV, or one you are authorised to use.</li>
          <li>No abuse, scraping of this service, or illegal content.</li>
        </ul>
        <h2>Your content</h2>
        <p>You keep ownership of your content. You allow us to process it to provide the service.</p>
        <h2>Limitation of liability</h2>
        <p>[Replace with wording reviewed by a legal professional.]</p>
        <h2>Contact</h2>
        <p>[Contact Email]</p>
      </Prose>
    </>
  );
}
