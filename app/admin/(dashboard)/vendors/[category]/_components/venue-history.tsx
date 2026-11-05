import { UPDATE_KIND_LABELS, type VenueUpdate } from "@/lib/venues/types";

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function VenueHistory({ updates, today }: { updates: VenueUpdate[]; today: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-xl text-ink">History</h2>
        <p className="text-sm text-foreground/60">Every update, newest first, with what it changed.</p>
      </div>

      {updates.length === 0 ? (
        <p className="text-sm text-foreground/60">Nothing logged yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {updates.map((update) => (
            <li key={update.id} className="flex flex-col gap-2 glass-card p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-foreground/70">
                  {UPDATE_KIND_LABELS[update.kind]}
                </span>
                <span className="font-medium text-ink">{formatDate(update.occurredOn)}</span>
                {update.occurredOn > today && (
                  <span className="rounded-full bg-aegean/15 px-2 py-0.5 text-xs font-medium text-aegean">
                    Planned
                  </span>
                )}
              </div>

              {update.changes.length > 0 && (
                <ul className="flex flex-col gap-0.5 text-sm text-foreground/70">
                  {update.changes.map((change) => (
                    <li key={change.field}>
                      <span className="font-medium text-ink">{change.label}:</span>{" "}
                      {change.from !== null && (
                        <>
                          <span className="text-foreground/50 line-through">{change.from}</span>
                          {" → "}
                        </>
                      )}
                      {change.to ?? "cleared"}
                    </li>
                  ))}
                </ul>
              )}

              {update.rawText && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-xs font-medium text-aegean">
                    {update.kind === "reply" ? "Their email" : "Notes"}
                  </summary>
                  <p className="mt-2 whitespace-pre-line text-foreground/70">{update.rawText}</p>
                </details>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
