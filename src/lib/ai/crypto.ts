import "server-only";
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

/** AES-256-GCM envelope for provider API keys. Format: v1.<iv>.<tag>.<ciphertext> (base64url). */
function key(): Buffer {
  const secret = env.MASTER_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) throw new Error("MASTER_ENCRYPTION_SECRET is not set (needs 32+ characters).");
  return Buffer.from(hkdfSync("sha256", secret, "careerpilot-ai", "provider-keys-v1", 32));
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), ct.toString("base64url")].join(".");
}

export function decryptSecret(blob: string): string {
  const [v, iv, tag, ct] = blob.split(".");
  if (v !== "v1" || !iv || !tag || !ct) throw new Error("Unsupported key format.");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(ct, "base64url")), d.final()]).toString("utf8");
}
