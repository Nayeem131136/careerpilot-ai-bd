import { Hero } from "@/components/marketing/hero";
import { JourneySection } from "@/components/marketing/journey-section";
import { FinalCta, MatchPreview, Section, TrustGrid } from "@/components/marketing/blocks";
import { Card } from "@/components/ui/primitives";
import { EXCLUSIVE, FAQ, FEATURES, STEPS } from "@/lib/content";

export default function Home() {
  return (
    <>
      <Hero />
      <Section title={<>See why a job fits, <span className="text-gradient">in plain language</span></>} sub="Every match comes with the reasons behind it, so you know what to apply for and what to learn next.">
        <MatchPreview />
      </Section>
      <JourneySection />
      <Section id="features" title="Everything between your CV and your offer" sub="One workspace for understanding your CV, finding jobs and scholarships, preparing applications and tracking deadlines.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="transition hover:border-primary/50"><h3 className="font-display text-lg font-bold">{f.title}</h3><p className="mt-2 text-sm text-muted">{f.body}</p></Card>
          ))}
        </div>
      </Section>
      <Section title="Built-in safeguards" sub="Small things that keep your feed fresh and your data yours.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {EXCLUSIVE.map((f, i) => (
            <Card key={f.title} className="relative overflow-hidden">
              <span className="absolute right-4 top-3 font-display text-5xl font-extrabold text-primary/10">{i + 1}</span>
              <h3 className="font-display text-lg font-bold">{f.title}</h3><p className="mt-2 text-sm text-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </Section>
      <Section title="How it works">
        <ol className="grid gap-4 md:grid-cols-5">
          {STEPS.map((s) => (
            <li key={s.n}><Card className="h-full"><span className="font-display text-3xl font-extrabold text-gradient">{s.n}</span><h3 className="mt-2 font-bold">{s.title}</h3><p className="mt-1.5 text-sm text-muted">{s.body}</p></Card></li>
          ))}
        </ol>
      </Section>
      <Section title="Privacy and trust" sub="You are handing over something personal. Here is how we treat it.">
        <TrustGrid />
      </Section>
      <Section title="Questions, answered honestly">
        <div className="mx-auto max-w-3xl divide-y divide-border rounded-2xl border border-border">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5 open:bg-card/50">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">{f.q}</summary>
              <p className="mt-2 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
      <FinalCta />
    </>
  );
}
