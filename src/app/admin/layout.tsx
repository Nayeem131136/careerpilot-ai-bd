import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Logo href="/dashboard" />
          <span className="hidden items-center gap-1.5 rounded-full border border-warn/40 bg-warn/10 px-2.5 py-0.5 text-xs font-medium text-warn sm:inline-flex"><ShieldCheck size={13} />Admin</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/admin" className="text-muted hover:text-fg">Overview</Link>
          <Link href="/admin/users" className="text-muted hover:text-fg">Users</Link>
          <Link href="/admin/jobs" className="text-muted hover:text-fg">Jobs</Link>
          <Link href="/admin/ai" className="text-muted hover:text-fg">AI</Link>
          <Link href="/admin/sources" className="text-muted hover:text-fg">Job sources</Link>
          <Link href="/dashboard" className="text-muted hover:text-fg">Back to app</Link>
          <ThemeToggle />
          <span className="hidden text-xs text-muted md:inline">{session.user.email}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
