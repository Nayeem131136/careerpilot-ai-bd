"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, Field, Input } from "@/components/ui/primitives";
import { saveScholarship } from "@/app/admin/scholarships/actions";
import { LEVELS, toList } from "@/lib/scholarships/types";
import { parseScholarshipText } from "@/lib/scholarships/parse";

export type FormValues = {
  name: string; provider: string; hostCountry: string; universities: string; levels: string[]; fields: string; funding: "full" | "partial";
  coverage: string; eligibility: string; bangladeshEligible: "yes" | "check"; language: string; howToApply: string; deadlineText: string; deadlineDate: string; officialUrl: string;
};
export const EMPTY: FormValues = { name: "", provider: "", hostCountry: "", universities: "", levels: ["master"], fields: "", funding: "full", coverage: "", eligibility: "", bangladeshEligible: "check", language: "", howToApply: "", deadlineText: "", deadlineDate: "", officialUrl: "https://" };

const ta = "w-full rounded-xl border border-border bg-bg/60 p-3 text-sm outline-none focus:border-primary";

export function ScholarshipForm({ id, initial }: { id: string | null; initial: FormValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [paste, setPaste] = useState("");
  const [fillMsg, setFillMsg] = useState<{ ok: boolean; text: string } | null>(null);
  function fill() {
    const r = parseScholarshipText(paste);
    if (!r) { setFillMsg({ ok: false, text: "Could not find fields in that text. It should have lines like “Name: …”, “Country of study: …”, “Official link: …”. You can also fill the form by hand." }); return; }
    const d = r.data;
    setV((p) => ({ ...p, ...d, universities: d.universities ?? p.universities, fields: d.fields ?? p.fields, levels: d.levels?.length ? d.levels : p.levels } as FormValues));
    setFillMsg({ ok: true, text: `Filled ${r.filled} fields. Check every one against the official page before saving.` });
  }
  const set = <K extends keyof FormValues>(k: K, val: FormValues[K]) => setV((p) => ({ ...p, [k]: val }));
  const text = (k: keyof FormValues, label: string, ph?: string) => (
    <Field label={label} htmlFor={`f-${k}`}><Input id={`f-${k}`} value={v[k] as string} onChange={(e) => set(k, e.target.value as never)} placeholder={ph} /></Field>
  );
  const area = (k: keyof FormValues, label: string) => (
    <Field label={label} htmlFor={`f-${k}`}><textarea id={`f-${k}`} rows={3} value={v[k] as string} onChange={(e) => set(k, e.target.value as never)} className={ta} /></Field>
  );
  function submit() {
    setMsg(null);
    start(async () => {
      const r = await saveScholarship(id, { ...v, universities: toList(v.universities), fields: toList(v.fields) });
      setMsg({ ok: r.ok, text: r.message });
      if (r.ok) { if (!id && r.id) router.replace(`/admin/scholarships/${r.id}`); router.refresh(); }
    });
  }
  return (
    <div className="space-y-6">
    {id === null && (
      <Card className="space-y-3">
        <h2 className="font-display text-lg font-bold">Paste details to fill the form</h2>
        <p className="text-sm text-muted">Paste one scholarship&apos;s details (for example the answer from ChatGPT, with lines like “Name: …”, “Funding: …”, “Official link: …”). Then press <b>Fill form</b>. Tracking parts of the link (like ?utm_source=chatgpt.com) are removed automatically.</p>
        <textarea aria-label="Pasted scholarship details" rows={6} value={paste} onChange={(e) => setPaste(e.target.value)} className={ta} placeholder={"Name: …\nProvider: …\nCountry of study: …\nOfficial link: https://…"} />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={fill} disabled={!paste.trim()}>Fill form</Button>
          {fillMsg && <p role="status" className={`text-sm ${fillMsg.ok ? "text-success" : "text-danger"}`}>{fillMsg.text}</p>}
        </div>
      </Card>
    )}
    <Card className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {text("name", "Scholarship name")}{text("provider", "Provider (who runs / funds it)")}
        {text("hostCountry", "Country of study", "e.g. Germany, or Multiple countries")}{text("officialUrl", "Official link (https)")}
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Study levels</legend>
        <div className="flex flex-wrap gap-4">
          {LEVELS.map((l) => (
            <label key={l.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.levels.includes(l.key)} onChange={(e) => set("levels", e.target.checked ? [...v.levels, l.key] : v.levels.filter((x) => x !== l.key))} />{l.label}</label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Funding" htmlFor="f-funding">
          <select id="f-funding" value={v.funding} onChange={(e) => set("funding", e.target.value as FormValues["funding"])} className="w-full rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="full">Fully funded (tuition + living costs)</option><option value="partial">Partial funding</option>
          </select>
        </Field>
        <Field label="Open to Bangladeshi applicants?" htmlFor="f-bd">
          <select id="f-bd" value={v.bangladeshEligible} onChange={(e) => set("bangladeshEligible", e.target.value as FormValues["bangladeshEligible"])} className="w-full rounded-xl border border-border bg-bg/60 px-3 py-2.5 text-sm outline-none focus:border-primary">
            <option value="yes">Yes, confirmed on the official page</option><option value="check">Not sure: users must check</option>
          </select>
        </Field>
        {text("universities", "Universities (comma separated)")}{text("fields", "Fields (comma separated, empty = all)")}
        {text("language", "Language requirement")}{text("deadlineText", "Deadline (as written)", "e.g. 31 January 2027, or Usually opens in autumn")}
        <Field label="Exact deadline date (optional)" htmlFor="f-dl"><Input id="f-dl" type="date" value={v.deadlineDate} onChange={(e) => set("deadlineDate", e.target.value)} /></Field>
      </div>
      {area("coverage", "What it covers")}{area("eligibility", "Who can apply")}{area("howToApply", "How to apply")}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        {msg && <p role="status" className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      </div>
    </Card>
    </div>
  );
}
