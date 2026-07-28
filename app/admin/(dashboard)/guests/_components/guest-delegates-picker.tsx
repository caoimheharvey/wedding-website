"use client";

import { useMemo, useState } from "react";
import type { Guest } from "@/lib/guests/types";
import { guestDisplayName } from "@/lib/guest-site/party-names";

export function GuestDelegatesPicker({
  guests,
  defaultDelegateIds = [],
}: {
  guests: Guest[];
  defaultDelegateIds?: string[];
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultDelegateIds);
  const [query, setQuery] = useState("");

  const selectedGuests = useMemo(
    () =>
      selectedIds
        .map((id) => guests.find((guest) => guest.id === id))
        .filter(Boolean) as Guest[],
    [guests, selectedIds],
  );

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return guests
      .filter(
        (guest) =>
          !selectedIds.includes(guest.id) &&
          guestDisplayName(guest).toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [guests, query, selectedIds]);

  return (
    <div className="flex flex-col gap-2">
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="rsvpDelegateIds" value={id} />
      ))}

      {selectedGuests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGuests.map((guest) => (
            <span
              key={guest.id}
              className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2.5 py-1 text-xs text-ink"
            >
              {guestDisplayName(guest)}
              <button
                type="button"
                onClick={() => setSelectedIds((ids) => ids.filter((id) => id !== guest.id))}
                className="text-terracotta hover:underline"
                aria-label={`Remove ${guestDisplayName(guest)}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search guests to add…"
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-foreground/40 focus:border-aegean focus:outline-none"
        />
        {matches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface shadow-md">
            {matches.map((guest) => (
              <li key={guest.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIds((ids) => [...ids, guest.id]);
                    setQuery("");
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-sand/50"
                >
                  {guestDisplayName(guest)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
