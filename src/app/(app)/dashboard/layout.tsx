import { AppShell } from "@/components/app/sidebar";
import { requireSession, resolveIsAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession(); // server-side guard on every dashboard route
  const isAdmin = await resolveIsAdmin(session.user);
  return <AppShell isAdmin={isAdmin} user={{ name: session.user.name, email: session.user.email }}>{children}</AppShell>;
}
