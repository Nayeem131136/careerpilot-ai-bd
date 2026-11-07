import { eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { DeleteAccount } from "@/components/app/settings-actions";
import { Card } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/session";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await requireSession();
  const accounts = await db.select({ providerId: schema.account.providerId }).from(schema.account).where(eq(schema.account.userId, session.user.id));
  const hasPassword = accounts.some((a) => a.providerId === "credential");
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <Card>
        <h2 className="font-display text-lg font-bold">Account</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Name</dt><dd className="font-medium">{session.user.name}</dd></div>
          <div><dt className="text-muted">Email</dt><dd className="font-medium">{session.user.email}</dd></div>
          <div><dt className="text-muted">Sign-in method</dt><dd className="font-medium">{accounts.map((a) => (a.providerId === "credential" ? "Email & password" : a.providerId)).join(", ") || "Unknown"}</dd></div>
        </dl>
      </Card>
      <Card>
        <h2 className="font-display text-lg font-bold">Your data</h2>
        <p className="mt-2 text-sm text-muted">Download everything we currently store about you as a JSON file.</p>
        <ButtonLink href="/api/account/export" variant="secondary" className="mt-4"><Download size={16} />Export my data</ButtonLink>
      </Card>
      <Card>
        <h2 className="font-display text-lg font-bold">Delete account</h2>
        <div className="mt-4"><DeleteAccount hasPassword={hasPassword} /></div>
      </Card>
    </div>
  );
}
