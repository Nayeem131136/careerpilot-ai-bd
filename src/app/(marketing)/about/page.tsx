import type { Metadata } from "next";
import { FinalCta, PageHeader, Prose } from "@/components/marketing/blocks";

export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <>
      <PageHeader eyebrow="About" title="Built for people starting their careers" />
      <Prose>
        <p>CareerPilot AI began with a simple frustration: finishing university is the start of a new problem. Where do I fit, what should I search for, and how do I stand out?</p>
        <h2>CV-first, not keyword-first</h2>
        <p>Most job sites make you guess the right title. We start from you: your education, skills, projects and experience, and we work outward to the careers and jobs that fit.</p>
        <h2>What we promise</h2>
        <ul>
          <li>We never apply or send email for you. You stay in control.</li>
          <li>We never invent jobs, recruiters, salaries or CV facts.</li>
          <li>We show where each job came from and when it was last verified.</li>
          <li>Match scores are explained guidance, not a prediction of hiring.</li>
        </ul>
        <h2>Who it is for</h2>
        <p>Students, fresh graduates, interns, juniors, career changers, freelancers and researchers, from every field. We started with fresh graduates in Bangladesh, and the platform is global.</p>
      </Prose>
      <FinalCta />
    </>
  );
}
