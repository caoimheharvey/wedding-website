"use client";

import { useMemo, useState } from "react";
import type { Guest } from "@/lib/guests/types";

export function GuestPicker({
  name,
  guests,
  defaultGuestId,
  placeholder = "Search guests by name…",
}: {
  name: string;
  guests: Guest[];
  defaultGuestId?: string | null;
  placeholder?: string;
}) {
  const defaultGuest = guests.find((guest) => guest.id === defaultGuestId) ?? null;
  const [selected, setSelected] = useState<Guest | null>(defaultGuest);
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return guests
      .filter((guest) => `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [guests, query]);

  return (
    <div>
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      {selected ? (
        <div className="flex items-center justify-between rounded-md border border-border bg-sand/40 px-3 py-2 text-sm">
          <span>
            {selected.firstName} {selected.lastName}
          </span>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-xs font-medium text-terracotta hover:underline"
          >
            Clear
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-foreground/40 focus:border-aegean focus:outline-none"
          />
          {matches.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-md border border-border bg-surface shadow-md">
              {matches.map((guest) => (
                <li key={guest.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(guest);
                      setQuery("");
                    }}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-sand/50"
                  >
                    {guest.firstName} {guest.lastName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
