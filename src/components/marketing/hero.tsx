"use client";
import { useRef } from "react";
import { FileText, Gauge, Send, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { HeroStage } from "@/components/three/hero-stage";

const chips = [
  { icon: FileText, text: "CV understood", cls: "left-0 top-[12%] sm:-left-4", delay: "0s" },
  { icon: Gauge, text: "Match explained", cls: "right-0 top-[40%] sm:-right-6", delay: "1.2s" },
  { icon: Send, text: "Draft ready. You send it.", cls: "bottom-[8%] left-[6%]", delay: "2.4s" },
];

export function Hero() {
  const wrap = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5).toFixed(3)));
    el.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5).toFixed(3)));
  };
  return (
    <section className="space-bg relative overflow-hidden">
      <div className="grid-lines absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pb-16 pt-14 sm:px-6 lg:min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr] lg:pb-10 lg:pt-6">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted">
            <ShieldCheck size={14} className="text-cyan" /> Drafts only. You always send applications yourself.
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Your Next Opportunity Is <span className="text-gradient">Closer Than You Think.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Upload your CV. Discover opportunities worldwide. Let AI help you build a career that matches your potential.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register" className="px-6 py-3 text-base">Upload your CV</ButtonLink>
            <ButtonLink href="/explore-careers" variant="secondary" className="px-6 py-3 text-base">Explore jobs</ButtonLink>
          </div>
          <p className="mt-5 text-xs text-muted">For every field, from IT to business, design, education and healthcare. English and Bengali CVs.</p>
        </div>
        <div ref={wrap} onPointerMove={onMove} className="relative mx-auto h-[360px] w-full max-w-[560px] sm:h-[460px] lg:h-[560px]" style={{ ["--px" as string]: 0, ["--py" as string]: 0 }}>
          <HeroStage />
          {chips.map((c, i) => (
            <div key={c.text} className={`glass absolute z-10 hidden items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium shadow-xl sm:flex ${c.cls}`}
              style={{ transform: `translate(calc(var(--px) * ${(i + 1) * -22}px), calc(var(--py) * ${(i + 1) * -16}px))`, transition: "transform .2s ease-out" }}>
              <span className="animate-float flex items-center gap-2" style={{ animationDelay: c.delay }}>
                <c.icon size={15} className="text-cyan" /> {c.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
