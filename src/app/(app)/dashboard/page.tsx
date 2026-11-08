import { eq } from "drizzle-orm";
import { Check, Circle, Cpu, FileText, Sparkles } from "lucide-react";
import { PiloOrb } from "@/components/brand/pilo-orb";
import { Badge, Card, Skeleton } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { getAiStatus } from "@/lib/ai/service";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await requireSession();
  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, session.user.id));
  const fields = [profile?.headline, profile?.country, profile?.city, profile?.experienceLevel];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  const ai = await getAiStatus();

  const steps = [
    { label: "Create your account", done: true },
    { label: "Complete onboarding", done: Boolean(profile?.onboardingCompleted), phase: 3 },
    { label: "Upload your CV", done: false, phase: 3 },
    { label: "Review your CV analysis", done: false, phase: 3 },
    { label: "Discover jobs matched to your CV", done: false, phase: 4 },
  ];

  return (
    <div className="space-y-6">
      <div className="space-bg relative flex items-center gap-5 overflow-hidden rounded-3xl border border-border p-6">
        <PiloOrb size={64} />
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome, {session.user.name}</h1>
          <p className="mt-1 text-sm text-muted">Your workspace is ready. The next steps below unlock as each phase of the platform is built.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Getting started</h2>
          <ul className="mt-4 space-y-3">
            {steps.map((s) => (
              <li key={s.label} className="flex items-center gap-3 text-sm">
                {s.done ? <Check size={18} className="text-success" /> : <Circle size={18} className="text-muted" />}
                <span className={s.done ? "" : "text-muted"}>{s.label}</span>
                {!s.done && s.phase && <Badge className="ml-auto">Phase {s.phase}</Badge>}
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
          <div className="mt-4 space-y-2"><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-3/5" /></div>
          <p className="mt-4 text-sm text-muted">No CV yet. Uploading arrives in Phase 3.</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2"><Sparkles size={18} className="text-cyan" /><h3 className="font-bold">Top matches</h3></div>
          <div className="mt-4 space-y-2"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></div>
          <p className="mt-4 text-sm text-muted">Matches appear after your CV is analysed and jobs are found. We never show sample jobs.</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2"><Cpu size={18} className="text-cyan" /><h3 className="font-bold">AI status</h3></div>
          {ai.configured
            ? <><p className="mt-4"><Badge tone="success">Ready</Badge></p><p className="mt-3 text-sm text-muted">AI is connected and will power your CV analysis, matches and drafts.</p></>
            : <><p className="mt-4"><Badge tone="warn">Not configured yet</Badge></p><p className="mt-3 text-sm text-muted">AI features switch on once the site admin connects an AI provider.</p></>}
        </Card>
      </div>
      <ButtonLink href="/dashboard/settings" variant="secondary">Account settings</ButtonLink>
    </div>
  );
}
