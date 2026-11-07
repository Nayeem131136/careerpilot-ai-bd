import type { Metadata } from "next";
import { DraftNotice, PageHeader, Prose } from "@/components/marketing/blocks";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Privacy() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy Policy" />
      <Prose>
        <DraftNotice />
        <p>Controller: [Your Name / Company], [Country]. Contact: [Contact Email]. Last updated: [Date].</p>
        <h2>What we store</h2>
        <p>Your account details (name, email), profile and preferences you enter, CV files you upload and the AI analysis of them, saved jobs, application drafts and tracker records.</p>
        <h2>AI processing</h2>
        <p>CV text and job descriptions are sent to a third-party AI provider ([AI provider name, set by the site owner]) to produce analysis and drafts. Please do not upload information you do not want processed this way. AI output can be wrong, so always review it.</p>
        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell your personal data or CV.</li>
          <li>We do not send applications or emails on your behalf.</li>
          <li>We do not store your email account password.</li>
        </ul>
        <h2>Your controls</h2>
        <p>You can edit your data, delete a CV, export your data and delete your account from your account settings. Deleting your account removes your account, profile and linked records. [State retention and backup periods.]</p>
        <h2>Security</h2>
        <p>Private file storage, access controls on every account-owned record, encrypted connections and hashed passwords. No online service can promise perfect security.</p>
        <h2>Cookies</h2>
        <p>See the Cookie Policy.</p>
        <h2>Age</h2>
        <p>The service is not intended for people under [minimum age].</p>
        <h2>Contact</h2>
        <p>[Contact Email] for privacy requests.</p>
      </Prose>
    </>
  );
}
