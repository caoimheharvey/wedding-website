import { listSeatingTablesWithGuests, listUnseatedYesGuests } from "@/lib/seating/queries";
import { AddTableForm } from "./_components/add-table-form";
import { TableCard } from "./_components/table-card";

export default async function SeatingPage() {
  const [tables, unseatedYesGuests] = await Promise.all([
    listSeatingTablesWithGuests(),
    listUnseatedYesGuests(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl text-ink">Seating</h1>

      <AddTableForm />

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
