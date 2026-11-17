import fs from "node:fs";
import path from "node:path";
import { PGlite, types } from "@electric-sql/pglite";

const MIGRATIONS = path.resolve(__dirname, "../../supabase/migrations");

/** Migration files in apply order, optionally stopping at (and including) a prefix like "0048". */
export function migrationFiles(upTo?: string): string[] {
  const files = fs.readdirSync(MIGRATIONS).filter((file) => file.endsWith(".sql")).sort();
  if (!upTo) return files;
  return files.filter((file) => file.slice(0, 4) <= upTo);
}

/** Supabase-only statements PGlite can't run (extensions, storage buckets, roles). */
function adapt(sql: string): string {
  return sql
    .replace(/create extension[^;]*;/gi, "")
    .replace(/insert into storage\.buckets[\s\S]*?on conflict[^;]*;/gi, "");
}

/**
 * An in-memory Postgres with the real migrations applied. Dates and
 * timestamps come back as the strings PostgREST returns, and numerics as
 * numbers, so the application's row mappers see what they see in production.
 */
export async function createDatabase(upTo?: string): Promise<PGlite> {
  const db = new PGlite({
    parsers: {
      [types.DATE]: (value: string) => value,
      [types.TIMESTAMP]: (value: string) => value,
      [types.TIMESTAMPTZ]: (value: string) => value,
      [types.NUMERIC]: (value: string) => Number(value),
    },
  });
  for (const file of migrationFiles(upTo)) {
    await applyMigration(db, file);
  }
  return db;
}

export async function applyMigration(db: PGlite, file: string): Promise<void> {
  try {
    await db.exec(adapt(fs.readFileSync(path.join(MIGRATIONS, file), "utf8")));
  } catch (error) {
    throw new Error(`Migration ${file} failed: ${error instanceof Error ? error.message : error}`);
  }
}
