import Link from "next/link";
import { listSeatingTablesWithGuests, listUnseatedYesGuests } from "@/lib/seating/queries";
import { TableCard } from "./_components/table-card";

export default async function SeatingPage() {
  const [tables, unseatedYesGuests] = await Promise.all([
    listSeatingTablesWithGuests(),
    listUnseatedYesGuests(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Seating</h1>
        <Link
          href="/admin/seating/new"
          className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
        >
          Add table
        </Link>
      </div>

      {tables.length === 0 ? (
        <p className="text-sm text-foreground/60">No tables yet. Add one above.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tables.map((table) => (
            <TableCard key={table.id} table={table} unseatedYesGuests={unseatedYesGuests} />
          ))}
        </div>
      )}
    </div>
  );
}
