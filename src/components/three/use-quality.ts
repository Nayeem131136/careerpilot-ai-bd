"use client";
import { useEffect, useState } from "react";

export type Quality = "static" | "low" | "high";

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Decides how much 3D to run. null = not decided yet (SSR / first paint). */
export function useQuality(): Quality | null {
  const [q, setQ] = useState<Quality | null>(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia("(max-width: 767px)");
    const decide = () => {
      if (reduced.matches || !webglAvailable()) return setQ("static");
      const weak = (navigator.hardwareConcurrency ?? 8) <= 4;
      setQ(small.matches || weak ? "low" : "high");
    };
    decide();
    reduced.addEventListener("change", decide);
    small.addEventListener("change", decide);
    return () => {
      reduced.removeEventListener("change", decide);
      small.removeEventListener("change", decide);
    };
  }, []);
  return q;
}

/** True while the element is on screen and the tab is visible: lets us pause rendering. */
export function useActive(ref: React.RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let inView = true;
    let tabVisible = !document.hidden;
    const sync = () => setActive(inView && tabVisible);
    const io = new IntersectionObserver(([e]) => { inView = e.isIntersecting; sync(); }, { threshold: 0.01 });
    io.observe(el);
    const vis = () => { tabVisible = !document.hidden; sync(); };
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, [ref]);
  return active;
}
