"use client";

import { useMemo, useState } from "react";
import type { Guest } from "@/lib/guests/types";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";
import {
  GuestsFilters,
  type InvitedByFilter,
  type PriorityFilter,
  type RsvpFilter,
} from "../../guests/_components/guests-filters";
import { GuestsSearch } from "../../guests/_components/guests-search";

function matchesSearch(guest: Guest, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [guestDisplayName(guest), guest.email].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

export function RecipientPicker({
  guests,
  effectiveStatusById,
  selected,
  onChange,
}: {
  guests: Guest[];
  effectiveStatusById: Record<string, EffectiveRsvpStatus>;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [invitedByFilter, setInvitedByFilter] = useState<InvitedByFilter>("all");
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const emailable = useMemo(() => guests.filter((guest) => guest.email?.trim()), [guests]);
  const excludedCount = guests.length - emailable.length;

  const filtered = useMemo(() => {
    return emailable
      .filter((guest) => matchesSearch(guest, searchQuery))
      .filter((guest) => priorityFilter === "all" || guest.relationshipPriority === priorityFilter)
      .filter((guest) => invitedByFilter === "all" || guest.invitedBy === invitedByFilter)
      .filter(
        (guest) =>
          rsvpFilter === "all" || (effectiveStatusById[guest.id] ?? "invited") === rsvpFilter,
      )
      .sort(
        (a, b) =>
          (a.lastName ?? "").localeCompare(b.lastName ?? "") ||
          (a.firstName ?? "").localeCompare(b.firstName ?? ""),
      );
  }, [emailable, searchQuery, priorityFilter, invitedByFilter, rsvpFilter, effectiveStatusById]);

  function toggle(guestId: string) {
    const next = new Set(selected);
    if (next.has(guestId)) next.delete(guestId);
    else next.add(guestId);
    onChange(next);
  }

  function selectAllFiltered() {
    const next = new Set(selected);
    for (const guest of filtered) next.add(guest.id);
    onChange(next);
  }

  function clearFiltered() {
    const next = new Set(selected);
    for (const guest of filtered) next.delete(guest.id);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">Recipients</p>
        <p className="text-sm text-foreground/60">{selected.size} selected</p>
      </div>

      {excludedCount > 0 && (
        <p className="text-xs text-foreground/50">
          {excludedCount} guest{excludedCount === 1 ? "" : "s"} have no email on file and are excluded.
        </p>
      )}

      <GuestsFilters
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
        invitedBy={invitedByFilter}
        onInvitedByChange={setInvitedByFilter}
        rsvp={rsvpFilter}
        onRsvpChange={setRsvpFilter}
      />
      <GuestsSearch value={searchQuery} onChange={setSearchQuery} />

      <div className="flex gap-3 text-xs font-medium text-aegean">
        <button type="button" onClick={selectAllFiltered} className="hover:underline">
          Select all shown ({filtered.length})
        </button>
        <button type="button" onClick={clearFiltered} className="hover:underline">
          Clear shown
        </button>
      </div>

      <div className="flex max-h-80 flex-col gap-1 overflow-y-auto rounded-lg border border-border p-2">
        {filtered.length === 0 ? (
          <p className="p-2 text-sm text-foreground/50">No guests match your search and filters.</p>
        ) : (
          filtered.map((guest) => (
            <label
              key={guest.id}
              className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-sand/40"
            >
              <input
                type="checkbox"
                checked={selected.has(guest.id)}
                onChange={() => toggle(guest.id)}
                className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
              />
              <span className="text-ink">{guestDisplayName(guest) || "Unnamed guest"}</span>
              <span className="text-foreground/50">{guest.email}</span>
            </label>
          ))
        )}
      </div>

      {[...selected].map((guestId) => (
        <input key={guestId} type="hidden" name="recipientIds" value={guestId} />
      ))}
    </div>
  );
}
