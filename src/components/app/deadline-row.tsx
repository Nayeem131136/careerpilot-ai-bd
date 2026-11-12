import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { whenLabel } from "@/lib/deadlines/parse";
import type { DeadlineItem } from "@/lib/deadlines/data";

export function DeadlineRow({ i }: { i: DeadlineItem }) {
  const tone = i.days === null ? "default" : i.days < 0 ? "danger" : i.days <= 3 ? "danger" : i.days <= 7 ? "warn" : "default";
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border p-3">
      <div className="min-w-0 flex-1">
        <Link href={i.href} className="font-semibold hover:text-primary">{i.title}</Link>
        <p className="text-xs text-muted">{i.kind === "application" ? "Application" : "Scholarship"} · {i.sub}{i.date ? ` · ${i.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}` : i.rawText ? ` · “${i.rawText}”` : ""}</p>
      </div>
      {i.days !== null && <Badge tone={tone}>{whenLabel(i.days)}</Badge>}
      {i.external && <a href={i.external} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs text-primary hover:underline" aria-label={`Open official page for ${i.title}`}>Official page <ExternalLink size={12} /></a>}
    </li>
  );
}
