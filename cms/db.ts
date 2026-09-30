import path from "path";
import { fileURLToPath } from "url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import type { Config, Migration } from "payload";
import { migrations as pgMigrations } from "./migrations-pg";
import { migrations as sqliteMigrations } from "./migrations";

/*
 * Where the content lives.
 *
 * - Production: Postgres (Supabase). Set SUPABASE_DATABASE_URL (or DATABASE_URI)
 *   to the postgres:// connection string. The site keeps its tables in their
 *   own schema, "jomiez_site", so it can share a
 *   Supabase project with the old portfolio without touching its tables.
 * - Development, or anywhere without a Postgres address: SQLite through libSQL,
 *   the local file jomiez.db (or a Turso database via DATABASE_URI=libsql://…).
 *
 * Each engine has its own migrations (cms/migrations-pg, cms/migrations); a
 * schema change needs both (see ADMIN.md → For developers).
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const databaseUrl = (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URI || process.env.DATABASE_URL || "").trim();
export const usesPostgres = /^postgres(ql)?:\/\//i.test(databaseUrl);
export const migrations = (usesPostgres ? pgMigrations : sqliteMigrations) as Migration[];

function postgresSsl(url: string) {
  const host = (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return "";
    }
  })();
  if (/^(localhost|127\.0\.0\.1|::1)$/.test(host) || /sslmode=disable/i.test(url)) return undefined;
  // Supabase's certificate authority can be given as DATABASE_CA_CERT (PEM) for
  // full verification; without it the connection is still encrypted.
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n");
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false };
}

export function database(): Config["db"] {
  if (usesPostgres) {
    // channel_binding breaks TLS through Supabase's pooler with node-postgres.
    const connectionString = databaseUrl.replace(/([?&])channel_binding=[^&]*&?/g, "$1").replace(/[?&]$/, "");
    return postgresAdapter({
      pool: { connectionString, ssl: postgresSsl(connectionString), max: Number(process.env.DATABASE_POOL_MAX || 5) },
      // Fixed: the Postgres migrations are written for this schema name.
      schemaName: "jomiez_site",
      push: false,
      migrationDir: path.resolve(root, "cms/migrations-pg"),
      prodMigrations: pgMigrations as Migration[],
    });
  }
  return sqliteAdapter({
    client: {
      url: databaseUrl || `file:${path.resolve(root, "jomiez.db")}`,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    },
    // The schema only ever changes through migrations, in development and
    // production alike, so the two never drift apart.
    push: false,
    migrationDir: path.resolve(root, "cms/migrations"),
    prodMigrations: sqliteMigrations as Migration[],
  });
}
