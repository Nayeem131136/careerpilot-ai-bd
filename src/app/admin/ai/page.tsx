import { desc, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { features } from "@/lib/env";
import { getAiSettings } from "@/lib/ai/service";
import { PROVIDERS, TASKS } from "@/lib/ai/providers";
import { AiControl } from "@/components/admin/ai-control";
import { Card } from "@/components/ui/primitives";

export default async function AiAdminPage() {
  const [providers, settings] = await Promise.all([
    db.select().from(schema.aiProviders).orderBy(schema.aiProviders.createdAt),
    getAiSettings(),
  ]);
  const usage = await db.select({
    provider: schema.aiUsage.providerKey,
    calls: sql<number>`count(*)::int`,
    failed: sql<number>`count(*) filter (where not ${schema.aiUsage.ok})::int`,
    tokens: sql<number>`coalesce(sum(coalesce(${schema.aiUsage.inputTokens},0) + coalesce(${schema.aiUsage.outputTokens},0)),0)::int`,
  }).from(schema.aiUsage).where(gte(schema.aiUsage.createdAt, sql`now() - interval '7 days'`)).groupBy(schema.aiUsage.providerKey);
  const recentErrors = await db.select({ at: schema.aiUsage.createdAt, provider: schema.aiUsage.providerKey, task: schema.aiUsage.task, error: schema.aiUsage.error })
    .from(schema.aiUsage).where(eq(schema.aiUsage.ok, false)).orderBy(desc(schema.aiUsage.createdAt)).limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">AI Control Center</h1>
        <p className="mt-1 text-sm text-muted">Choose which AI provider powers the whole site. Keys are encrypted and can never be read back, only replaced.</p>
      </div>
      {!features.encryptionSecret && (
        <Card className="border-warn/50">
          <p className="text-sm font-semibold text-warn">MASTER_ENCRYPTION_SECRET is not set</p>
          <p className="mt-1 text-sm text-muted">Add it in your host&apos;s environment variables (32+ random characters) and redeploy. Until then, API keys cannot be saved.</p>
        </Card>
      )}
      <AiControl
        catalogue={PROVIDERS.map(({ key, label, tier, defaultModel, note, keyUrl, custom }) => ({ key, label, tier, defaultModel, note, keyUrl, custom: Boolean(custom) }))}
        tasks={TASKS.map((t) => ({ ...t }))}
        providers={providers.map((p) => ({
          id: p.id, providerKey: p.providerKey, label: p.label, keyLast4: p.keyLast4, baseUrl: p.baseUrl, model: p.model, enabled: p.enabled,
          lastTestAt: p.lastTestAt?.toISOString() ?? null, lastTestOk: p.lastTestOk, lastTestMsg: p.lastTestMsg,
        }))}
        settings={{ primaryProviderId: settings.primaryProviderId, fallbackProviderId: settings.fallbackProviderId, dailyUserLimit: settings.dailyUserLimit, routing: settings.routing }}
        encryptionReady={features.encryptionSecret}
      />
      <Card>
        <h2 className="font-display text-lg font-bold">Usage, last 7 days</h2>
        {usage.length === 0 ? <p className="mt-3 text-sm text-muted">No AI calls yet.</p> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-muted"><tr><th className="py-1.5 pr-4">Provider</th><th className="pr-4">Calls</th><th className="pr-4">Failed</th><th>Tokens</th></tr></thead>
              <tbody>{usage.map((u) => <tr key={u.provider} className="border-t border-border"><td className="py-1.5 pr-4">{u.provider}</td><td className="pr-4">{u.calls}</td><td className="pr-4">{u.failed}</td><td>{u.tokens.toLocaleString()}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        {recentErrors.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold">Recent errors</h3>
            <ul className="mt-2 space-y-1.5 text-xs text-muted">
              {recentErrors.map((e, i) => <li key={i}><span className="text-fg">{e.provider}</span> · {e.task} · {e.at.toISOString().slice(0, 16).replace("T", " ")} UTC: {e.error}</li>)}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
