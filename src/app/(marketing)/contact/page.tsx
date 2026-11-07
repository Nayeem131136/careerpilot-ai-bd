import type { Metadata } from "next";
import { PageHeader, Prose } from "@/components/marketing/blocks";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <>
      <PageHeader eyebrow="Contact" title="Get in touch" />
      <Prose>
        {email ? (
          <p>Email us at <a className="text-primary underline" href={`mailto:${email}`}>{email}</a>. For privacy requests such as export or deletion, you can also use the options in your account settings.</p>
        ) : (
          <p>A public contact channel has not been configured yet. If you are the site owner, set <code>NEXT_PUBLIC_CONTACT_EMAIL</code> to show it here.</p>
        )}
        <p>To report a suspicious job, use the Report button on the job itself once you are signed in.</p>
      </Prose>
    </>
  );
}
