import { cn } from "@/lib/utils";

/** "Pilo": the AI presence. A living orb (no face, no borrowed character). */
export function PiloOrb({ size = 56, thinking = false, className }: { size?: number; thinking?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-block", className)} style={{ width: size, height: size }} role="img" aria-label="Pilo, the CareerPilot AI assistant">
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #B6A4FF 18%, #4D7CFE 48%, #8B5CF6 78%, #0D1225 100%)",
          boxShadow: "0 0 28px 4px rgba(77,124,254,.45), inset 0 0 18px rgba(54,217,255,.35)",
          animation: "orb-pulse 4.5s ease-in-out infinite",
        }}
      />
      <span
        className="absolute -inset-1.5 rounded-full border border-cyan/40"
        style={{ borderTopColor: "transparent", animation: `orb-spin ${thinking ? 1.2 : 7}s linear infinite` }}
      />
    </span>
  );
}
