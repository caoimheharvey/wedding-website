import type { Destination } from "@/lib/destinations/types";
import type { Vendor } from "@/lib/vendors/types";
import { DestinationCard } from "./destination-card";

/** Quick-glance view of narrowed-down candidates — full list (with Compare) is further down. */
export function ShortlistedDestinations({
  destinations,
  vendors,
}: {
  destinations: Destination[];
  vendors: Vendor[];
}) {
  const shortlisted = destinations.filter((destination) => destination.isShortlisted);
  if (shortlisted.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-lg text-ink">Shortlisted</h2>
        <p className="text-xs text-foreground/60">
          Narrowed-down candidates — reach out to vendors and planners for these first.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {shortlisted.map((destination) => (
          <DestinationCard key={destination.id} destination={destination} vendors={vendors} />
        ))}
      </div>
    </section>
  );
}
