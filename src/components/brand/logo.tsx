import Link from "next/link";
import { cn } from "@/lib/utils";

/** Original mark: a paper-plane rising out of a small constellation of skill-stars. */
export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="cp-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4D7CFE" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#0D1225" />
      <path d="M14 44 L24 30 L38 36 L50 16" fill="none" stroke="url(#cp-g)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".8" />
      <circle cx="14" cy="44" r="3.5" fill="#36D9FF" />
      <circle cx="24" cy="30" r="3.5" fill="#B6A4FF" />
      <circle cx="38" cy="36" r="3.5" fill="#36D9FF" />
      <path d="M50 12 L58 30 L50 26 L42 30 Z" fill="url(#cp-g)" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight", className)} aria-label="CareerPilot AI home">
      <LogoMark />
      <span>
        CareerPilot <span className="text-gradient">AI</span>
      </span>
    </Link>
  );
}
