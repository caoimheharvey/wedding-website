import Link from "next/link";
import { listUnseatedYesGuests } from "@/lib/seating/queries";
import { AddTableForm } from "../_components/add-table-form";

export default async function NewSeatingTablePage() {
  const eligibleGuests = await listUnseatedYesGuests();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/seating" className="text-sm text-aegean hover:underline">
          ← Back to seating
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Add table</h1>
      </div>
      <AddTableForm eligibleGuests={eligibleGuests} />
    </div>
  );
}
