import { count, desc, eq } from "drizzle-orm";
import { Briefcase, Check, Circle, Cpu, FileText, Sparkles } from "lucide-react";
import { PiloOrb } from "@/components/brand/pilo-orb";
import { Badge, Card } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/session";
import Link from "next/link";
import { getAiStatus } from "@/lib/ai/service";
import { getDeadlines } from "@/lib/deadlines/data";
import { DeadlineRow } from "@/components/app/deadline-row";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireSession();
  const uid = session.user.id;
  const [[profile], [cv], ai, [{ n: matchCount }], [{ n: appCount }], [roadmap], top, appRows, deadlines] = await Promise.all([
    db.select().from(schema.profiles).where(eq(schema.profiles.userId, uid)),
    db.select({ status: schema.cvs.status, reviewedAt: schema.cvs.reviewedAt }).from(schema.cvs).where(eq(schema.cvs.userId, uid)),
    getAiStatus(),
    db.select({ n: count() }).from(schema.jobMatches).where(eq(schema.jobMatches.userId, uid)),
    db.select({ n: count() }).from(schema.applications).where(eq(schema.applications.userId, uid)),
    db.select({ id: schema.roadmaps.id }).from(schema.roadmaps).where(eq(schema.roadmaps.userId, uid)),
    db.select({ score: schema.jobMatches.score, title: schema.jobs.title, company: schema.jobs.company }).from(schema.jobMatches)
      .innerJoin(schema.jobs, eq(schema.jobs.id, schema.jobMatches.jobId)).where(eq(schema.jobMatches.userId, uid)).orderBy(desc(schema.jobMatches.score)).limit(3),
    db.select({ status: schema.applications.status, n: count() }).from(schema.applications).where(eq(schema.applications.userId, uid)).groupBy(schema.applications.status),
    getDeadlines(uid),
  ]);
  const fields = [profile?.headline, profile?.country, profile?.city, profile?.experienceLevel, cv?.status === "analyzed" ? "cv" : null];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const upcoming = deadlines.filter((d) => d.days !== null && d.days >= 0 && d.days <= 30).slice(0, 4);
  const by = new Map(appRows.map((r) => [r.status, r.n]));

  const steps = [
    { label: "Create your account", done: true },
    { label: "Complete onboarding", done: Boolean(profile?.onboardingCompleted), href: "/dashboard/onboarding" },
    { label: "Upload your CV", done: Boolean(cv), href: "/dashboard/cv" },
    { label: "Review your CV analysis", done: Boolean(cv?.reviewedAt), href: "/dashboard/cv" },
    { label: "Find jobs and check your AI match", done: matchCount > 0, href: "/dashboard/jobs" },
    { label: "Prepare your first application", done: appCount > 0, href: "/dashboard/jobs" },
    { label: "Build your skills roadmap", done: Boolean(roadmap), href: "/dashboard/roadmap" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-bg relative flex items-center gap-5 overflow-hidden rounded-3xl border border-border p-6">
        <PiloOrb size={64} />
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome, {session.user.name}</h1>
          <p className="mt-1 text-sm text-muted">Your workspace is ready. Follow the steps below. You always review and send applications yourself.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Getting started</h2>
          <ul className="mt-4 space-y-3">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                {s.done ? <Check size={18} className="text-success" /> : <Circle size={18} className="text-muted" />}
                {s.href && !s.done ? <Link href={s.href} className="text-fg underline-offset-4 hover:underline">{s.label}</Link> : <span className={s.done ? "" : "text-muted"}>{s.label}</span>}
                              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-bold">Profile completeness</h2>
          <p className="mt-3 font-display text-4xl font-extrabold">{completeness}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-gradient-to-r from-primary to-cyan" style={{ width: `${completeness}%` }} /></div>
          <p className="mt-3 text-xs text-muted">Calculated from your saved profile fields.</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-2"><FileText size={18} className="text-cyan" /><h3 className="font-bold">CV</h3></div>
          <p className="mt-4 text-sm text-muted">{cv ? (cv.reviewedAt ? "Your CV is analysed and reviewed." : cv.status === "analyzed" ? "Your CV is analysed. Please review it." : "Your CV is uploaded.") : "No CV yet."} <Link href="/dashboard/cv" className="text-primary hover:underline">{cv ? "Open" : "Upload now"}</Link></p>
        </Card>
        <Card>
          <div className="flex items-center gap-2"><Sparkles size={18} className="text-cyan" /><h3 className="font-bold">Top AI matches</h3></div>
          {top.length === 0 ? <p className="mt-4 text-sm text-muted">On the Jobs page, press “Why this fits?” on jobs you like. Your best matches will show here. We never show sample jobs.</p> : (
            <ul className="mt-4 space-y-2 text-sm">{top.map((t, i) => <li key={i} className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate">{t.title} <span className="text-muted">· {t.company}</span></span><span className="shrink-0 font-semibold text-success">{t.score}</span></li>)}</ul>
          )}
        </Card>
        <Card>
          <div className="flex items-center gap-2"><Cpu size={18} className="text-cyan" /><h3 className="font-bold">AI status</h3></div>
          {ai.configured && ai.lastTestOk === true
            ? <><p className="mt-4"><Badge tone="success">Ready</Badge></p><p className="mt-3 text-sm text-muted">AI is connected and will power your CV analysis, matches and drafts.</p></>
            : ai.configured
              ? <><p className="mt-4"><Badge tone="warn">{ai.lastTestOk === false ? "Needs attention" : "Not verified"}</Badge></p><p className="mt-3 text-sm text-muted">{ai.lastTestOk === false ? "The last connection test failed. The site admin should check the AI Control Center." : "A provider is selected but has not passed a connection test yet."}</p></>
              : <><p className="mt-4"><Badge tone="warn">Not configured yet</Badge></p><p className="mt-3 text-sm text-muted">AI features switch on once the site admin connects an AI provider.</p></>}
        </Card>
      </div>
      {upcoming.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2"><h3 className="font-bold">Upcoming deadlines</h3><Link href="/dashboard/deadlines" className="text-sm text-primary hover:underline">See all</Link></div>
          <ul className="space-y-2">{upcoming.map((d) => <DeadlineRow key={d.key} i={d} />)}</ul>
        </Card>
      )}
      <Card>
        <div className="flex items-center gap-2"><Briefcase size={18} className="text-cyan" /><h3 className="font-bold">Your applications</h3></div>
        {appCount === 0 ? <p className="mt-3 text-sm text-muted">Nothing tracked yet. Open a job and press “Prepare application”.</p> : (
          <p className="mt-3 text-sm text-muted">{appCount} tracked · {by.get("applied") ?? 0} applied · {by.get("interview") ?? 0} interview · {by.get("offer") ?? 0} offer. <Link href="/dashboard/applications" className="text-primary hover:underline">Open applications</Link></p>
        )}
      </Card>
      <ButtonLink href="/dashboard/settings" variant="secondary">Account settings</ButtonLink>
    </div>
  );
}
