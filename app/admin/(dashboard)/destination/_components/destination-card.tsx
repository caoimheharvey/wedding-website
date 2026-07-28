"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteDestination, setDestinationSelected } from "@/lib/destinations/actions";
import type { Destination } from "@/lib/destinations/types";

export function DestinationCard({
  destination,
  isComparing,
  onToggleCompare,
  compareDisabled,
}: {
  destination: Destination;
  isComparing: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggleSelected() {
    startTransition(async () => {
      await setDestinationSelected(destination.id, !destination.isSelected);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${destination.name}"?`)) return;
    startTransition(async () => {
      await deleteDestination(destination.id);
    });
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 ${
        destination.isSelected ? "border-olive bg-olive/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-ink">{destination.name}</h3>
            {destination.isSelected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-olive px-2 py-0.5 text-xs font-medium text-whitewash">
                ✓ Selected destination
              </span>
            )}
          </div>
          {destination.location && (
            <p className="mt-0.5 text-sm text-foreground/60">{destination.location}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/destination/${destination.id}/edit`}
            className="text-xs font-medium text-aegean hover:underline"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs font-medium text-terracotta hover:underline disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      <dl className="flex flex-col gap-1 text-sm text-foreground/70">
        {destination.estimatedCost != null && (
          <div className="font-medium text-ink">€{destination.estimatedCost.toLocaleString()} estimated</div>
        )}
        {destination.guestCapacityNotes && <div>{destination.guestCapacityNotes}</div>}
        {destination.travelNotes && <div>{destination.travelNotes}</div>}
        {destination.description && <div className="text-foreground/60">{destination.description}</div>}
        {destination.pros && (
          <div>
            <span className="font-medium text-olive">Pros: </span>
            {destination.pros}
          </div>
        )}
        {destination.cons && (
          <div>
            <span className="font-medium text-terracotta">Cons: </span>
            {destination.cons}
          </div>
        )}
        {destination.notes && <div className="text-foreground/60 italic">{destination.notes}</div>}
      </dl>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={destination.isSelected}
            onChange={handleToggleSelected}
            disabled={isPending}
            className="h-4 w-4 rounded border-border text-olive focus:ring-olive"
          />
          Selected destination
        </label>
        <label
          className={`flex items-center gap-2 text-sm ${compareDisabled ? "text-foreground/30" : "text-ink"}`}
        >
          <input
            type="checkbox"
            checked={isComparing}
            onChange={onToggleCompare}
            disabled={compareDisabled}
            className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean disabled:opacity-50"
          />
          Compare
        </label>
      </div>
    </div>
  );
}
