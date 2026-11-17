import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { db, withTestDatabase } from "./helpers/harness";

withTestDatabase();

const ROOT = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), "utf8");

function walk(dir: string): string[] {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(relative);
    return /\.(ts|tsx)$/.test(entry.name) ? [relative] : [];
  });
}

// Every database column must be read by the code that builds the model and
// written by something. A column nobody reads is a field that can be saved
// but never displayed; one nobody writes is a field the UI can't change.
const TABLES: Record<string, { read: string[]; skipRead?: string[]; skipWrite?: string[] }> = {
  vendors: { read: ["lib/vendors/queries.ts"] },
  venue_details: { read: ["lib/venues/rows.ts"] },
  venue_profile: { read: ["lib/venues/costs/rows.ts"] },
  venue_cost_items: { read: ["lib/venues/costs/rows.ts"] },
  venue_services: { read: ["lib/venues/costs/rows.ts"] },
  venue_ratings: { read: ["lib/venues/costs/rows.ts"] },
  guests: { read: ["lib/guests/queries.ts"] },
  budget_items: { read: ["lib/budget/queries.ts"] },
  budget_contributions: { read: ["lib/budget/queries.ts"] },
  planning_checklist_items: { read: ["lib/planning/queries.ts"] },
  site_settings: { read: ["lib/rsvp/queries.ts", "lib/budget/queries.ts"] },
};

// Bookkeeping columns, and fields that are deliberately write-only or read-only.
const BOOKKEEPING = new Set(["id", "created_at", "updated_at"]);
const NOT_READ: Record<string, string[]> = {
  venue_cost_items: [],
  venue_ratings: [],
};
// Dead columns from an earlier plus-one request/approval flow (replaced by
// `plus_one_allowed`): they are read into the model, but nothing writes them
// and no screen shows them, so they are always null. Documented, not deleted.
const NOT_WRITTEN: Record<string, string[]> = {
  guests: ["plus_one_status", "plus_one_requested_relationship"],
};

const writers = walk("lib")
  .concat(walk("app"))
  .filter((file) => !file.includes("queries.ts") && !file.endsWith(".test.ts"))
  .map((file) => ({ file, text: read(file) }))
  .filter(({ text }) => /\.(insert|update|upsert)\(|ToRow|toRow/.test(text));

describe("every database column is read and written by the application", () => {
  for (const [table, config] of Object.entries(TABLES)) {
    it(table, async () => {
      const { rows } = await db.query<{ column_name: string }>(
        "select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position",
        [table],
      );
      const columns = rows.map((row) => row.column_name);
      expect(columns.length, `${table} should exist`).toBeGreaterThan(0);

      const readSource = config.read.map(read).join("\n");
      const unread = columns.filter((column) => !BOOKKEEPING.has(column) && !(NOT_READ[table] ?? []).includes(column) && !readSource.includes(column));
      const unwritten = columns.filter(
        (column) => !BOOKKEEPING.has(column) && !(NOT_WRITTEN[table] ?? []).includes(column) && !writers.some(({ text }) => text.includes(column)),
      );

      expect(unread, `${table}: columns never read by ${config.read.join(", ")}`).toEqual([]);
      expect(unwritten, `${table}: columns no insert/update/upsert code writes`).toEqual([]);
    });
  }
});
