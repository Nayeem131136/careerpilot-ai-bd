import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PiloOrb } from "@/components/brand/pilo-orb";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between"><Logo /><ThemeToggle /></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-center text-xs text-muted">By continuing you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
      </div>
      <aside className="space-bg relative hidden items-center justify-center overflow-hidden border-l border-border lg:flex" aria-hidden="true">
        <div className="grid-lines absolute inset-0 opacity-60" />
        <div className="relative max-w-sm text-center">
          <PiloOrb size={120} className="mx-auto" />
          <h2 className="mt-8 text-3xl font-extrabold">Your skills, <span className="text-gradient">your constellation.</span></h2>
          <p className="mt-3 text-muted">Upload your CV and see where it can take you. You always review and send applications yourself.</p>
        </div>
      </aside>
    </div>
  );
}
