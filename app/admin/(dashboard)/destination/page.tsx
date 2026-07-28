import Link from "next/link";
import { listDestinations } from "@/lib/destinations/queries";
import { DestinationList } from "./_components/destination-list";

export default async function DestinationPage() {
  const destinations = await listDestinations();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Destination</h1>
          <p className="text-sm text-foreground/60">
            Weigh up destination options and compare them side by side to help decide.
          </p>
        </div>
        <Link
          href="/admin/destination/new"
          className="rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
        >
          Add destination
        </Link>
      </div>

      <DestinationList destinations={destinations} />
    </div>
  );
}
