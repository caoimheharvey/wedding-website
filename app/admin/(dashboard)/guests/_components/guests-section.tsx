"use client";

import { useMemo, useState, useTransition } from "react";
import { setGuestRsvpDeadlineOverrides } from "@/lib/rsvp/actions";
import type { GuestWithPlusOnes } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { DefaultDeadlineEditor } from "./default-deadline-editor";
import { GuestStats } from "./guest-stats";
import {
  GuestsFilters,
  type InvitedByFilter,
  type PriorityFilter,
  type RsvpFilter,
} from "./guests-filters";
import { GuestsList } from "./guests-list";

export function GuestsSection({
  guests,
  nameById,
  effectiveStatusById,
  defaultDeadline,
}: {
  guests: GuestWithPlusOnes[];
  nameById: Record<string, string>;
  effectiveStatusById: Record<string, EffectiveRsvpStatus>;
  defaultDeadline: string | null;
}) {
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deadlineInput, setDeadlineInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [invitedByFilter, setInvitedByFilter] = useState<InvitedByFilter>("all");
  const [rsvpFilter, setRsvpFilter] = useState<RsvpFilter>("all");

  const alphabetically = (a: GuestWithPlusOnes, b: GuestWithPlusOnes) =>
    (a.lastName ?? "").localeCompare(b.lastName ?? "") || a.firstName.localeCompare(b.firstName);

  const { orderedGuests, nestedIds } = useMemo(() => {
    const flat = guests.flatMap((guest) => [guest, ...guest.plusOnes]);
    const filtered = flat
      .filter((guest) => priorityFilter === "all" || guest.relationshipPriority === priorityFilter)
      .filter((guest) => invitedByFilter === "all" || guest.invitedBy === invitedByFilter)
      .filter(
        (guest) =>
          rsvpFilter === "all" || (effectiveStatusById[guest.id] ?? "invited") === rsvpFilter,
      );

    // A plus-one nests under their primary only if that primary also passed
    // the filters; otherwise they're shown as their own top-level row so the
    // relationship isn't implied by indentation under a row that isn't there.
    const idsInView = new Set(filtered.map((guest) => guest.id));
    const isTopLevel = (guest: GuestWithPlusOnes) =>
      !guest.isPlusOneOf || !idsInView.has(guest.isPlusOneOf);

    const topLevel = filtered.filter(isTopLevel).sort(alphabetically);

    const childrenByParent = new Map<string, GuestWithPlusOnes[]>();
    for (const guest of filtered) {
      if (!isTopLevel(guest) && guest.isPlusOneOf) {
        const list = childrenByParent.get(guest.isPlusOneOf) ?? [];
        list.push(guest);
        childrenByParent.set(guest.isPlusOneOf, list);
      }
    }

    const ordered: GuestWithPlusOnes[] = [];
    const nested = new Set<string>();
    for (const primary of topLevel) {
      ordered.push(primary);
      for (const child of (childrenByParent.get(primary.id) ?? []).sort(alphabetically)) {
        ordered.push(child);
        nested.add(child.id);
      }
    }

    return { orderedGuests: ordered, nestedIds: nested };
  }, [guests, priorityFilter, invitedByFilter, rsvpFilter, effectiveStatusById]);

  function toggleSelect(guestId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(guestId)) next.delete(guestId);
      else next.add(guestId);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
    setDeadlineInput("");
  }

  function applyDeadline(deadline: string | null) {
    startTransition(async () => {
      const result = await setGuestRsvpDeadlineOverrides([...selected], deadline);
      setMessage(result.message ?? null);
      exitSelectMode();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <DefaultDeadlineEditor deadline={defaultDeadline} />
        {!selectMode && (
          <button
            type="button"
            onClick={() => setSelectMode(true)}
            className="text-xs font-medium text-foreground/40 hover:text-aegean"
          >
            Select Custom Guest Deadlines
          </button>
        )}
      </div>

      {selectMode && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-sand/40 px-4 py-3">
          <span className="text-sm font-medium text-ink">{selected.size} selected</span>
          <input
            type="date"
            value={deadlineInput}
            onChange={(event) => setDeadlineInput(event.target.value)}
            className="input w-auto"
          />
          <button
            type="button"
            disabled={isPending || !deadlineInput || selected.size === 0}
            onClick={() => applyDeadline(deadlineInput)}
            className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
          >
            Set RSVP deadline
          </button>
          <button
            type="button"
            disabled={isPending || selected.size === 0}
            onClick={() => applyDeadline(null)}
            className="text-sm font-medium text-terracotta hover:underline disabled:opacity-50"
          >
            Clear override
          </button>
          <button
            type="button"
            onClick={exitSelectMode}
            className="text-sm text-foreground/60 hover:underline"
          >
            Cancel
          </button>
        </div>
      )}
      {message && <p className="text-sm text-foreground/60">{message}</p>}

      <GuestStats guests={guests} effectiveStatusById={effectiveStatusById} />

      <GuestsFilters
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
        invitedBy={invitedByFilter}
        onInvitedByChange={setInvitedByFilter}
        rsvp={rsvpFilter}
        onRsvpChange={setRsvpFilter}
      />

      <GuestsList
        guests={orderedGuests}
        nestedIds={nestedIds}
        nameById={nameById}
        effectiveStatusById={effectiveStatusById}
        selected={selected}
        onToggleSelect={selectMode ? toggleSelect : undefined}
      />
    </div>
  );
}
