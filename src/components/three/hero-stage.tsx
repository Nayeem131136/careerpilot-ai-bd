"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { PiloOrb } from "@/components/brand/pilo-orb";
import { useActive, useQuality } from "./use-quality";

const HeroScene = dynamic(() => import("./hero-scene"), { ssr: false, loading: () => null });

/** Static fallback: used for reduced motion, no WebGL, and while 3D is loading. */
export function HeroFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
      <div className="relative flex h-[min(70vw,380px)] w-[min(70vw,380px)] items-center justify-center rounded-full border border-primary/25" style={{ background: "radial-gradient(circle, rgba(139,92,246,.22), transparent 65%)" }}>
        <div className="absolute inset-6 rounded-full border border-cyan/25" />
        <div className="absolute inset-14 rounded-full border border-accent/30" />
        <PiloOrb size={110} />
      </div>
    </div>
  );
}

export function HeroStage() {
  const quality = useQuality();
  const ref = useRef<HTMLDivElement>(null);
  const active = useActive(ref);
  return (
    <div ref={ref} className="relative h-full w-full">
      <HeroFallback />
      {quality && quality !== "static" && (
        <div className="absolute inset-0"><HeroScene quality={quality} active={active} /></div>
      )}
    </div>
  );
}
