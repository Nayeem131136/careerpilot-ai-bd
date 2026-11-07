import type { Metadata } from "next";
import { DraftNotice, PageHeader, Prose } from "@/components/marketing/blocks";

export const metadata: Metadata = { title: "Cookie Policy" };

export default function Cookies() {
  return (
    <>
      <PageHeader eyebrow="Legal" title="Cookie Policy" />
      <Prose>
        <DraftNotice />
        <h2>What we use</h2>
        <ul>
          <li><strong>Essential cookies:</strong> keep you signed in and protect your session.</li>
          <li><strong>Preference storage:</strong> remembers your light or dark theme in your browser.</li>
        </ul>
        <p>We do not currently use advertising cookies. If analytics are added later, this page will be updated and consent will be requested where required. [Update if this changes.]</p>
      </Prose>
    </>
  );
}
