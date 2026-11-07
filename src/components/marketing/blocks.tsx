import { Check, X, Lock, EyeOff, Download, Trash2 } from "lucide-react";
import { Card, Badge } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="space-bg relative overflow-hidden border-b border-border/70">
      <div className="grid-lines absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
        {eyebrow && <Badge className="mb-4">{eyebrow}</Badge>}
        <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
        {children && <p className="mx-auto mt-4 max-w-2xl text-muted sm:text-lg">{children}</p>}
      </div>
    </section>
  );
}

export function Section({ title, sub, children, id }: { title?: React.ReactNode; sub?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {title && (
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
          {sub && <p className="mx-auto mt-3 max-w-2xl text-muted">{sub}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:mt-1.5 [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted">{children}</div>;
}

export function DraftNotice() {
  return (
    <div role="note" className="mb-8 rounded-xl border border-warn/50 bg-warn/10 p-4 text-sm">
      <strong>Draft: review with a qualified legal professional before public launch.</strong> Items in [square brackets] are placeholders that must be replaced with real information.
    </div>
  );
}

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="space-bg relative overflow-hidden rounded-3xl border border-border px-6 py-14 text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Let your CV show you where to go next.</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted">Create a free account, upload your CV and see what AI understands about you.</p>
        <div className="mt-7 flex justify-center gap-3">
          <ButtonLink href="/register" className="px-6 py-3 text-base">Get started</ButtonLink>
          <ButtonLink href="/how-it-works" variant="secondary" className="px-6 py-3 text-base">How it works</ButtonLink>
        </div>
      </div>
    </section>
  );
}

/** Illustrative preview only. Clearly labelled; never presented as real data. */
export function MatchPreview() {
  const score = 87;
  const R = 44, C = 2 * Math.PI * R;
  return (
    <Card className="mx-auto max-w-3xl overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <span className="text-sm font-semibold">Match analysis</span>
        <Badge tone="warn">Illustrative example, not real data</Badge>
      </div>
      <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center">
        <div className="relative mx-auto h-36 w-36">
          <svg viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle cx="50" cy="50" r={R} fill="none" stroke="url(#ring)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
            <defs><linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4D7CFE" /><stop offset="1" stopColor="#36D9FF" /></linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="font-display text-3xl font-extrabold">{score}</span><span className="text-xs text-muted">Strong match</span></div>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">Junior Python Developer</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Matching skills</p>
              <ul className="space-y-1 text-sm">{["Python", "Django", "REST API", "SQL"].map((s) => <li key={s} className="flex items-center gap-2"><Check size={15} className="text-success" />{s}</li>)}</ul>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Missing (optional)</p>
              <ul className="space-y-1 text-sm">{["Docker", "AWS"].map((s) => <li key={s} className="flex items-center gap-2"><X size={15} className="text-warn" />{s}</li>)}</ul>
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-primary/10 p-3 text-sm">Recommendation: apply. Missing skills are not necessarily disqualifying, and a roadmap shows how to close them.</p>
        </div>
      </div>
    </Card>
  );
}

export function TrustGrid() {
  const items = [
    { icon: Lock, t: "Private by default", b: "Your CV is stored privately and only your account can open it." },
    { icon: EyeOff, t: "No auto-apply, no auto-email", b: "Nothing is sent without you. You review every draft." },
    { icon: Download, t: "Export your data", b: "Download everything we store about you whenever you like." },
    { icon: Trash2, t: "Delete anytime", b: "Remove a CV or your whole account in a few clicks." },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((i) => (
        <Card key={i.t}><i.icon className="text-cyan" /><h3 className="mt-3 font-bold">{i.t}</h3><p className="mt-1.5 text-sm text-muted">{i.b}</p></Card>
      ))}
    </div>
  );
}
