import type { ExclusionEntry, Exclusions } from "@/lib/venues/analysis/analyse";

function List({
  title,
  tone,
  entries,
  empty,
  detail,
}: {
  title: string;
  tone: string;
  entries: ExclusionEntry[];
  empty: string;
  detail: (entry: ExclusionEntry) => string | null;
}) {
  return (
    <div>
      <h3 className={`text-sm font-medium ${tone}`}>
        {title} <span className="font-normal text-foreground/50">({entries.length})</span>
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-foreground/50">{empty}</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1 text-sm text-ink">
          {entries.map((entry) => (
            <li key={entry.serviceKey}>
              {entry.label}
              {detail(entry) && <span className="text-foreground/60">: {detail(entry)}</span>}
              {entry.notes && <span className="text-xs text-foreground/50"> ({entry.notes})</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Generated from the services checklist; edits there update this immediately. */
export function VenueExclusions({ exclusions }: { exclusions: Exclusions }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <List
        title="Confirmed not provided"
        tone="text-terracotta"
        entries={exclusions.notProvided}
        empty="Nothing confirmed as not provided yet."
        detail={(entry) => (entry.status === "not_permitted" ? "not permitted" : "not provided by the venue")}
      />
      <List
        title="Only available at additional cost"
        tone="text-aegean"
        entries={exclusions.additionalCost}
        empty="No services marked as extra-cost yet."
        detail={(entry) => (entry.priceText ? entry.priceText : "not priced yet")}
      />
      <List
        title="Unconfirmed: not yet known (these are not confirmed exclusions)"
        tone="text-foreground/60"
        entries={exclusions.unconfirmed}
        empty="Everything has been confirmed."
        detail={() => null}
      />
    </div>
  );
}
