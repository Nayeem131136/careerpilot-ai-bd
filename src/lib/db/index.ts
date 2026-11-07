import "server-only";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";
import { env } from "@/lib/env";

export type Db = NodePgDatabase<typeof schema>;

// Stored on `process` (shared by every bundle/VM context in the Node process), so dev hot-reloads and
// separate route bundles never open the embedded database twice.
const g = process as unknown as { __cpDb?: Promise<Db | null> };

async function create(): Promise<Db | null> {
  if (env.DATABASE_URL) {
    neonConfig.webSocketConstructor = ws;
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    return drizzleNeon({ client: pool, schema }) as unknown as Db;
  }
  if (env.NODE_ENV === "production") return null; // not configured: callers see a clear error
  // Development only: embedded Postgres (PGlite) so the app runs with zero setup.
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dataDir = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db as unknown as Db;
}

const pending = (g.__cpDb ??= create());
pending.catch(() => { if (g.__cpDb === pending) g.__cpDb = undefined; }); // never cache a failure
const resolved = await pending;

export const dbConfigured = resolved !== null;

const notConfigured = () => {
  throw new Error("Database is not configured. Set DATABASE_URL (Neon) and run `npm run db:migrate`. See DEPLOY.md.");
};

/** Database handle. In production without DATABASE_URL, any use throws a clear error (builds still pass). */
export const db: Db =
  resolved ??
  (new Proxy({} as Db, {
    get: (_t, prop) => (prop === "then" ? undefined : notConfigured()),
  }));

export { schema };
