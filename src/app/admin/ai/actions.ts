"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { encryptSecret } from "@/lib/ai/crypto";
import { assertSafeBaseUrl } from "@/lib/ai/adapters";
import { providerDef, TASKS } from "@/lib/ai/providers";
import { testProvider } from "@/lib/ai/service";
import { requireAdminAction } from "@/lib/session";

type Result = { ok: boolean; message: string };
const fail = (message: string): Result => ({ ok: false, message });
const done = (message: string): Result => { revalidatePath("/admin/ai"); return { ok: true, message }; };

const providerSchema = z.object({
  providerKey: z.string().min(1).max(40),
  apiKey: z.string().trim().max(500).optional(),
  baseUrl: z.string().trim().max(300).optional(),
  model: z.string().trim().min(1, "Model is required.").max(120),
  enabled: z.boolean(),
});

export async function saveProvider(input: z.input<typeof providerSchema>): Promise<Result> {
  try {
    const admin = await requireAdminAction();
    const d = providerSchema.safeParse(input);
    if (!d.success) return fail(d.error.issues[0]?.message ?? "Invalid input.");
    const def = providerDef(d.data.providerKey);
    if (!def) return fail("Unknown provider.");
    const baseUrl = def.custom ? d.data.baseUrl : undefined;
    if (def.custom) {
      if (!baseUrl) return fail("Base URL is required for a custom provider.");
      try { assertSafeBaseUrl(baseUrl); } catch (e) { return fail((e as Error).message); }
    }
    const [existing] = await db.select().from(schema.aiProviders).where(eq(schema.aiProviders.providerKey, def.key));
    const key = d.data.apiKey;
    if (!existing && !key) return fail("Paste an API key.");
    if (key && !env.MASTER_ENCRYPTION_SECRET) return fail("MASTER_ENCRYPTION_SECRET is not set on the server, so keys cannot be stored safely.");
    if (key && key.length < 8) return fail("That API key looks too short.");

    const values = {
      label: def.label, baseUrl: baseUrl ?? null, model: d.data.model, enabled: d.data.enabled, updatedAt: new Date(),
      ...(key ? { apiKeyEnc: encryptSecret(key), keyLast4: key.slice(-4), lastTestAt: null, lastTestOk: null, lastTestMsg: null } : {}),
    };
    if (existing) await db.update(schema.aiProviders).set(values).where(eq(schema.aiProviders.id, existing.id));
    else await db.insert(schema.aiProviders).values({ providerKey: def.key, apiKeyEnc: encryptSecret(key!), keyLast4: key!.slice(-4), ...values });
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: existing ? "ai.provider.update" : "ai.provider.create", target: def.key, meta: { keyChanged: Boolean(key), model: d.data.model } });
    return done(key ? "Saved. Run “Test connection” to verify the key." : "Saved.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong.");
  }
}

export async function removeProvider(id: string): Promise<Result> {
  try {
    const admin = await requireAdminAction();
    const [p] = await db.select().from(schema.aiProviders).where(eq(schema.aiProviders.id, z.string().uuid().parse(id)));
    if (!p) return fail("Provider not found.");
    await db.delete(schema.aiProviders).where(eq(schema.aiProviders.id, p.id));
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: "ai.provider.delete", target: p.providerKey });
    return done("Provider removed.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong.");
  }
}

export async function testConnection(id: string): Promise<Result> {
  try {
    const admin = await requireAdminAction();
    const r = await testProvider(z.string().uuid().parse(id), admin.user.id);
    revalidatePath("/admin/ai");
    return r;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong.");
  }
}

const settingsSchema = z.object({
  primaryProviderId: z.string().uuid().nullable(),
  fallbackProviderId: z.string().uuid().nullable(),
  dailyUserLimit: z.number().int().min(1).max(10000),
  routing: z.record(z.string(), z.object({ providerId: z.string().uuid().optional(), model: z.string().trim().max(120).optional() })),
});

export async function saveSettings(input: z.input<typeof settingsSchema>): Promise<Result> {
  try {
    const admin = await requireAdminAction();
    const d = settingsSchema.safeParse(input);
    if (!d.success) return fail("Invalid settings.");
    const s = d.data;
    if (s.primaryProviderId && s.primaryProviderId === s.fallbackProviderId) return fail("Primary and fallback must be different providers.");
    const allowed = new Set<string>(TASKS.map((t) => t.key));
    const routing = Object.fromEntries(Object.entries(s.routing).filter(([k, v]) => allowed.has(k) && (v.providerId || v.model)));
    const row = { primaryProviderId: s.primaryProviderId, fallbackProviderId: s.fallbackProviderId, dailyUserLimit: s.dailyUserLimit, routing, updatedAt: new Date() };
    await db.insert(schema.aiSettings).values({ id: "global", ...row }).onConflictDoUpdate({ target: schema.aiSettings.id, set: row });
    await db.insert(schema.auditLogs).values({ actorId: admin.user.id, action: "ai.settings.update", meta: { primary: s.primaryProviderId, fallback: s.fallbackProviderId, limit: s.dailyUserLimit } });
    return done("Settings saved.");
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Something went wrong.");
  }
}
