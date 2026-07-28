import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { listGuests } from "@/lib/guests/queries";
import type { Guest } from "@/lib/guests/types";
import { mockListSeatingTables } from "./mock-store";
import type { SeatingTable, SeatingTableWithGuests } from "./types";

interface SeatingTableRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: SeatingTableRow): SeatingTable {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function byName(
  a: { firstName: string; lastName: string | null },
  b: { firstName: string; lastName: string | null },
) {
  return (a.lastName ?? "").localeCompare(b.lastName ?? "") || a.firstName.localeCompare(b.firstName);
}

export async function listSeatingTables(): Promise<SeatingTable[]> {
  if (isLocalTestMode()) return mockListSeatingTables();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("seating_tables")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load seating tables: ${error.message}`);
  return (data as SeatingTableRow[]).map(mapRow);
}

/** Seating tables with the guests currently assigned to each. */
export async function listSeatingTablesWithGuests(): Promise<SeatingTableWithGuests[]> {
  const [tables, guests] = await Promise.all([listSeatingTables(), listGuests()]);

  const guestsByTable = new Map<string, Guest[]>();
  for (const guest of guests) {
    if (!guest.seatingTableId) continue;
    const list = guestsByTable.get(guest.seatingTableId) ?? [];
    list.push(guest);
    guestsByTable.set(guest.seatingTableId, list);
  }

  return tables.map((table) => ({
    ...table,
    guests: (guestsByTable.get(table.id) ?? []).sort(byName),
  }));
}

/** Guests who've RSVP'd yes and aren't already seated at a table. */
export async function listUnseatedYesGuests(): Promise<Guest[]> {
  const guests = await listGuests();
  return guests
    .filter((guest) => guest.rsvpStatus === "yes" && !guest.seatingTableId)
    .sort(byName);
}
