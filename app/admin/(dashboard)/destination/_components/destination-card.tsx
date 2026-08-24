"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteDestination, setDestinationSelected, setDestinationShortlisted } from "@/lib/destinations/actions";
import type { Destination } from "@/lib/destinations/types";
import type { Vendor } from "@/lib/vendors/types";
import { DestinationVendors } from "./destination-vendors";
import { OutreachForm } from "./outreach-form";

export function DestinationCard({
  destination,
  isComparing = false,
  onToggleCompare,
  compareDisabled = false,
  vendors = [],
}: {
  destination: Destination;
  isComparing?: boolean;
  /** Compare checkbox is hidden entirely when this isn't provided. */
  onToggleCompare?: () => void;
  compareDisabled?: boolean;
  /** All vendors — filtered to this destination internally for the outreach detail. */
  vendors?: Vendor[];
}) {
  const [isPending, startTransition] = useTransition();

  function handleToggleSelected() {
    startTransition(async () => {
      await setDestinationSelected(destination.id, !destination.isSelected);
    });
  }

  function handleToggleShortlisted() {
    startTransition(async () => {
      await setDestinationShortlisted(destination.id, !destination.isShortlisted);
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
      className={`flex flex-col gap-3 rounded-lg border p-4 backdrop-blur-xl backdrop-saturate-150 ${
        destination.isSelected ? "border-olive bg-olive/10" : "border-white/50 bg-white/45"
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
            {destination.isShortlisted && !destination.isSelected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-aegean px-2 py-0.5 text-xs font-medium text-whitewash">
                Shortlisted
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
        {destination.costRationale && (
          <div className="text-xs text-foreground/50 italic">{destination.costRationale}</div>
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
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={destination.isShortlisted}
            onChange={handleToggleShortlisted}
            disabled={isPending}
            className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
          />
          Shortlist
        </label>
        {onToggleCompare && (
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
        )}
      </div>

      {destination.isShortlisted && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div>
            <p className="mb-1.5 text-xs font-medium tracking-wide text-foreground/50 uppercase">
              Linked vendors
            </p>
            <DestinationVendors
              vendors={vendors.filter((vendor) => vendor.destinationId === destination.id)}
            />
          </div>
          <OutreachForm destination={destination} />
        </div>
      )}
    </div>
  );
}
