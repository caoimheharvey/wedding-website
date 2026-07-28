"use client";

import { useActionState, useMemo, useState } from "react";
import { createSeatingTable, type SeatingTableActionState } from "@/lib/seating/actions";
import type { Guest } from "@/lib/guests/types";
import { PriorityBadge } from "../../guests/_components/priority-badge";

const initialState: SeatingTableActionState = undefined;

export function AddTableForm({ eligibleGuests }: { eligibleGuests?: Guest[] }) {
  const [state, formAction, isPending] = useActionState(createSeatingTable, initialState);
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredGuests = useMemo(() => {
    if (!eligibleGuests) return [];
    const q = query.trim().toLowerCase();
    if (!q) return eligibleGuests;
    return eligibleGuests.filter((guest) =>
      `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.toLowerCase().includes(q),
    );
  }, [eligibleGuests, query]);

  function toggleGuest(guestId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(guestId)) next.delete(guestId);
      else next.add(guestId);
      return next;
    });
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <h2 className="font-display text-lg text-ink">Add a table</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-ink">
          Name
          <input name="name" required className="input" placeholder="e.g. Table 1" />
          {state?.errors?.name && (
            <span className="text-xs text-terracotta">{state.errors.name[0]}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Description
          <input name="description" className="input" placeholder="e.g. Near the dance floor" />
        </label>
      </div>

      {eligibleGuests && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Seat guests here (optional)</span>
            <span className="text-xs text-foreground/50">{selectedIds.size} selected</span>
          </div>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search guests by name…"
            className="input"
          />
          <div className="max-h-56 overflow-y-auto rounded-md border border-border">
            {filteredGuests.length === 0 ? (
              <p className="p-3 text-sm text-foreground/50">
                {eligibleGuests.length === 0
                  ? "No unseated guests with a Yes RSVP yet."
                  : "No guests match that search."}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {filteredGuests.map((guest) => (
                  <li key={guest.id}>
                    <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-sand/40">
                      <input
                        type="checkbox"
                        name="guestIds"
                        value={guest.id}
                        checked={selectedIds.has(guest.id)}
                        onChange={() => toggleGuest(guest.id)}
                        className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
                      />
                      <span className="flex-1">
                        {guest.firstName} {guest.lastName}
                      </span>
                      <PriorityBadge priority={guest.relationshipPriority} />
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {state?.message && <p className="text-sm text-terracotta">{state.message}</p>}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add table"}
        </button>
      </div>
    </form>
  );
}
