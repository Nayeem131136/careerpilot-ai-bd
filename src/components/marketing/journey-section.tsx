"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Globe2, Rocket, Sparkles } from "lucide-react";
import { useActive, useQuality } from "@/components/three/use-quality";

const JourneyScene = dynamic(() => import("@/components/three/journey-scene"), { ssr: false, loading: () => null });

const steps = [
  { icon: Sparkles, title: "Your skills become a constellation", body: "Every skill and experience on your CV becomes a star. Together they form a shape that is unique to you, including strengths you did not know to search for." },
  { icon: Globe2, title: "Opportunities across the globe", body: "We search the sources that are connected, from Bangladesh to Asia, Europe, the Middle East and North America, plus remote roles and circulars you paste in." },
  { icon: Rocket, title: "Prepare. Then you launch.", body: "AI prepares tailored drafts and a checklist. You review, edit and send them yourself. We never apply for you." },
];

export function JourneySection() {
  const quality = useQuality();
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [step, setStep] = useState(0);
  const active = useActive(stage);
  const animated = quality === "high" || quality === "low";

  useEffect(() => {
    if (!animated) return;
    const onScroll = () => {
      const el = wrap.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = Math.min(1, Math.max(0, total > 0 ? -r.top / total : 0));
      progress.current = p;
      const s = p < 0.33 ? 0 : p < 0.68 ? 1 : 2;
      setStep((prev) => (prev === s ? prev : s));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [animated]);

  return (
    <section aria-labelledby="journey-title" className="border-y border-border/70">
      <div className="mx-auto max-w-6xl px-4 pt-20 text-center sm:px-6">
        <h2 id="journey-title" className="text-3xl font-extrabold sm:text-4xl">From your CV to your <span className="text-gradient">launch</span></h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted">Scroll through the journey: understand, discover, prepare.</p>
      </div>
      {!animated ? (
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border bg-card/70 p-6">
              <s.icon className="text-primary" />
              <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <div ref={wrap} className="relative h-[270vh]">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] items-center">
            <div className="mx-auto grid w-full max-w-6xl items-center gap-4 px-4 sm:px-6 md:grid-cols-2">
              <div className="order-2 space-y-4 md:order-1">
                {steps.map((s, i) => (
                  <div key={s.title} className={`rounded-2xl border p-5 transition-all duration-500 ${i === step ? "border-primary/60 bg-card/80 opacity-100 shadow-[0_0_40px_-10px_rgba(77,124,254,.6)]" : "border-border opacity-45"}`}>
                    <div className="flex items-center gap-3">
                      <s.icon className={i === step ? "text-cyan" : "text-muted"} size={20} />
                      <h3 className="font-display text-lg font-bold">{s.title}</h3>
                    </div>
                    {i === step && <p className="mt-2 text-sm text-muted">{s.body}</p>}
                  </div>
                ))}
              </div>
              <div ref={stage} className="relative order-1 h-[42vh] md:order-2 md:h-[60vh]">
                {quality && <JourneyScene quality={quality as "low" | "high"} active={active} progress={progress} />}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
