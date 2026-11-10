import type { Metadata } from "next";
import { DraftNotice, PageHeader, Prose } from "@/components/marketing/blocks";
import { legal, legalComplete } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <Prose>
        {!legalComplete && <DraftNotice />}
        <p>Operator: {legal.owner || "[Your Name / Company]"}, {legal.country || "[Country]"}. Contact: {legal.email || "[Contact Email]"}. Last updated: {legal.updated}.</p>
        <h2>What we store</h2>
        <p>Your account details (name, email), the profile and preferences you enter, the <strong>text</strong> of your CV and the AI analysis of it (we do not keep the original file), jobs you save or hide, AI match results, your application tracker, drafts and notes, and your learning roadmap. We also keep technical records such as sign-in sessions and AI usage counts (task, time, success) to run and protect the service.</p>
        <h2>AI processing</h2>
        <p>To analyse your CV, compare it with jobs, write drafts and build roadmaps, the relevant text (your CV content and the job description) is sent to a third-party AI provider chosen by the site operator, for example Groq, Google, OpenAI or Anthropic. That provider processes it under its own terms. Please do not upload information you do not want processed this way. AI output can be wrong, so always review it.</p>
        <h2>Job listings</h2>
        <p>Jobs come from public job sources and company career pages, and from listings added by the site operator. Each job links back to its original source. Searches sent to job sources use your target roles and countries but never your name, email or CV.</p>
        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell your personal data or CV.</li>
          <li>We do not send applications or emails on your behalf. You copy a draft and send it yourself.</li>
          <li>We do not store your email account password.</li>
        </ul>
        <h2>Your controls</h2>
        <p>You can edit your CV data, export your data and delete your account from Settings. Deleting your account removes your account and all linked records from our live database immediately. Copies may remain in our database host&apos;s backups for a short period before they expire.</p>
        <h2>Security</h2>
        <p>Passwords are hashed, API keys are encrypted, connections are encrypted, and every record is protected so you can only open your own. The site operator can suspend or delete accounts that abuse the service. No online service can promise perfect security.</p>
        <h2>Cookies</h2>
        <p>See the Cookie Policy.</p>
        <h2>Age</h2>
        <p>The service is intended for people aged 16 and over.</p>
        <h2>Contact</h2>
        <p>{legal.email || "[Contact Email]"} for privacy requests.</p>
      </Prose>
    </>
  );
}
