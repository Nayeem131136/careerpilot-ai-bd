"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { BriefcaseBusiness, ChevronsLeft, ChevronsRight, FileText, GraduationCap, KanbanSquare, LayoutDashboard, LogOut, Settings, ShieldCheck } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/cv", label: "My CV", icon: FileText },
  { href: "/dashboard/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/dashboard/applications", label: "Applications", icon: KanbanSquare },
  { href: "/dashboard/roadmap", label: "Skills & roadmap", icon: GraduationCap },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AppShell({ user, isAdmin = false, children }: { user: { name: string; email: string }; isAdmin?: boolean; children: React.ReactNode }) {
  const items = isAdmin ? [...nav, { href: "/admin/ai", label: "Admin", icon: ShieldCheck, exact: false }] : nav;
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card/40 p-3 transition-[width] md:flex", collapsed ? "w-[68px]" : "w-64")}>
        <div className="flex h-12 items-center px-1.5">{collapsed ? <LogoMark /> : <Logo href="/dashboard" />}</div>
        <nav className="mt-4 flex flex-1 flex-col gap-1" aria-label="App">
          {items.map((n) => {
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} title={n.label} aria-current={active ? "page" : undefined}
                className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", active ? "bg-primary/15 text-fg shadow-[inset_2px_0_0_var(--primary)]" : "text-muted hover:bg-card hover:text-fg")}>
                <n.icon size={18} className={active ? "text-cyan" : ""} />{!collapsed && n.label}
              </Link>
            );
          })}
        </nav>
        <button type="button" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted hover:text-fg">
          {collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} />Collapse</>}
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-xl">
          <div className="md:hidden"><Logo href="/dashboard" /></div>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden text-right leading-tight sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-muted">{user.email}</p></div>
            <button type="button" onClick={signOut} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm text-muted hover:text-fg"><LogOut size={16} /><span className="hidden sm:inline">Log out</span></button>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-border px-2 py-2 md:hidden" aria-label="App mobile">
          {items.map((n) => {
            const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
            return <Link key={n.href} href={n.href} aria-current={active ? "page" : undefined} className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium", active ? "bg-primary/15 text-fg" : "text-muted")}><n.icon size={15} />{n.label}</Link>;
          })}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
