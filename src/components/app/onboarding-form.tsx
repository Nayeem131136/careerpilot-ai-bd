"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, Input } from "@/components/ui/primitives";
import { saveOnboarding, type OnboardingInput } from "@/app/(app)/dashboard/onboarding/actions";
import { ARRANGEMENTS, CATEGORIES, COUNTRIES, EMPLOYMENT, LEVEL_LABELS } from "@/lib/options";
import { cn } from "@/lib/utils";

function Chips({ options, value, onChange, label }: { options: string[]; value: string[]; onChange: (v: string[]) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        return <button key={o} type="button" aria-pressed={on} onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
          className={cn("rounded-full border px-3 py-1.5 text-sm transition", on ? "border-primary bg-primary/15 text-fg" : "border-border text-muted hover:text-fg")}>{o}</button>;
      })}
    </div>
  );
}
const selectCls = "w-full rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary";

export function OnboardingForm({ initial }: { initial: OnboardingInput }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [titles, setTitles] = useState(initial.jobTitles.join(", "));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = <K extends keyof OnboardingInput>(k: K, val: OnboardingInput[K]) => setV((p) => ({ ...p, [k]: val }));
  const num = (s: string) => (s === "" ? null : Math.max(0, Number(s) || 0));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const jobTitles = titles.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10);
      const r = await saveOnboarding({ ...v, jobTitles });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) { router.push("/dashboard/cv"); router.refresh(); }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <h2 className="font-display text-lg font-bold">About you</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2"><label htmlFor="headline" className="text-sm font-medium">Professional headline</label><Input id="headline" maxLength={160} value={v.headline} onChange={(e) => set("headline", e.target.value)} placeholder="e.g. Final-year CSE student, interested in web development" /></div>
          <div className="space-y-1.5"><label htmlFor="country" className="text-sm font-medium">Country</label><Input id="country" maxLength={80} value={v.country} onChange={(e) => set("country", e.target.value)} placeholder="Bangladesh" /></div>
          <div className="space-y-1.5"><label htmlFor="city" className="text-sm font-medium">City</label><Input id="city" maxLength={80} value={v.city} onChange={(e) => set("city", e.target.value)} placeholder="Dhaka" /></div>
          <div className="space-y-1.5"><label htmlFor="level" className="text-sm font-medium">Experience level</label>
            <select id="level" className={selectCls} value={v.experienceLevel ?? ""} onChange={(e) => set("experienceLevel", (e.target.value || null) as OnboardingInput["experienceLevel"])}>
              <option value="">Select…</option>{Object.entries(LEVEL_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select></div>
          <div className="space-y-1.5"><label htmlFor="li" className="text-sm font-medium">LinkedIn (optional)</label><Input id="li" type="url" maxLength={200} value={v.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/…" /></div>
          <div className="space-y-1.5"><label htmlFor="gh" className="text-sm font-medium">GitHub (optional)</label><Input id="gh" type="url" maxLength={200} value={v.githubUrl} onChange={(e) => set("githubUrl", e.target.value)} placeholder="https://github.com/…" /></div>
          <div className="space-y-1.5"><label htmlFor="pf" className="text-sm font-medium">Portfolio (optional)</label><Input id="pf" type="url" maxLength={200} value={v.portfolioUrl} onChange={(e) => set("portfolioUrl", e.target.value)} placeholder="https://…" /></div>
        </div>
      </Card>

      <Card className="space-y-5">
        <h2 className="font-display text-lg font-bold">What are you looking for?</h2>
        <div className="space-y-2"><p className="text-sm font-medium">Fields you are interested in</p><Chips label="Fields" options={CATEGORIES} value={v.jobCategories} onChange={(x) => set("jobCategories", x)} /></div>
        <div className="space-y-1.5"><label htmlFor="titles" className="text-sm font-medium">Job titles you want (comma separated)</label><Input id="titles" value={titles} onChange={(e) => setTitles(e.target.value)} placeholder="Junior Web Developer, QA Engineer" /></div>
        <div className="space-y-2"><p className="text-sm font-medium">Where would you work?</p><Chips label="Countries" options={COUNTRIES} value={v.countries} onChange={(x) => set("countries", x)} /></div>
        <div className="space-y-2"><p className="text-sm font-medium">Work arrangement</p><Chips label="Arrangement" options={ARRANGEMENTS} value={v.workArrangements} onChange={(x) => set("workArrangements", x)} /></div>
        <div className="space-y-2"><p className="text-sm font-medium">Employment type</p><Chips label="Employment" options={EMPLOYMENT} value={v.employmentTypes} onChange={(x) => set("employmentTypes", x)} /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.visaSponsorship} onChange={(e) => set("visaSponsorship", e.target.checked)} className="size-4 accent-[var(--primary)]" />I need visa sponsorship for jobs abroad</label>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5"><label htmlFor="smin" className="text-sm font-medium">Salary from (monthly, optional)</label><Input id="smin" type="number" min={0} value={v.salaryMin ?? ""} onChange={(e) => set("salaryMin", num(e.target.value))} /></div>
          <div className="space-y-1.5"><label htmlFor="smax" className="text-sm font-medium">Salary to</label><Input id="smax" type="number" min={0} value={v.salaryMax ?? ""} onChange={(e) => set("salaryMax", num(e.target.value))} /></div>
          <div className="space-y-1.5"><label htmlFor="cur" className="text-sm font-medium">Currency</label><Input id="cur" maxLength={5} value={v.salaryCurrency} onChange={(e) => set("salaryCurrency", e.target.value.toUpperCase())} placeholder="BDT" /></div>
        </div>
      </Card>

      {msg && <p role="status" className={cn("text-sm", msg.ok ? "text-success" : "text-danger")}>{msg.text}</p>}
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save and continue to CV"}</Button>
    </form>
  );
}
