import "server-only";
import type { SeatingTable } from "./types";

// Fixed (non-random) ids so lib/guests/mock-store.ts can pre-assign a few
// seed guests to these tables for testing, without a circular import.
export const SEATING_SEED_TABLE_IDS = {
  headTable: "seed-table-head",
  table2: "seed-table-2",
} as const;

/**
 * In-memory seating tables used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 */
let tables: SeatingTable[] = seed();

function seed(): SeatingTable[] {
  const now = new Date().toISOString();
  return [
    {
      id: SEATING_SEED_TABLE_IDS.headTable,
      name: "Head Table",
      description: "Wedding party + immediate family",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: SEATING_SEED_TABLE_IDS.table2,
      name: "Table 2",
      description: "Close friends",
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function mockListSeatingTables(): SeatingTable[] {
  return [...tables].sort((a, b) => a.name.localeCompare(b.name));
}

export function mockInsertSeatingTable(data: { name: string; description: string | null }): SeatingTable {
  const now = new Date().toISOString();
  const table: SeatingTable = { id: crypto.randomUUID(), ...data, createdAt: now, updatedAt: now };
  tables.push(table);
  return table;
}

export function mockUpdateSeatingTable(
  id: string,
  data: { name: string; description: string | null },
): SeatingTable | null {
  const index = tables.findIndex((table) => table.id === id);
  if (index === -1) return null;

  const updated: SeatingTable = { ...tables[index], ...data, updatedAt: new Date().toISOString() };
  tables[index] = updated;
  return updated;
}

export function mockDeleteSeatingTable(id: string): void {
  tables = tables.filter((table) => table.id !== id);
}
