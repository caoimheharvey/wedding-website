"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteVendor, setVendorSelected } from "@/lib/vendors/actions";
import { getBudgetFit } from "@/lib/vendors/budget-fit";
import { hireInclVat } from "@/lib/venues/pricing";
import { OUTREACH_STATUS_LABELS, type VenueDetails } from "@/lib/venues/types";
import type { Vendor } from "@/lib/vendors/types";
import type { Destination } from "@/lib/destinations/types";
import { BookingStatusForm } from "./booking-status-form";

export function VendorCard({
  vendor,
  category,
  categoryBudgeted,
  isComparing,
  onToggleCompare,
  compareDisabled,
  selectedDestination,
  vendorDestinationName,
  venueDetails = null,
}: {
  vendor: Vendor;
  category: string;
  categoryBudgeted: number;
  isComparing: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
  /** The destination that's been chosen, if any — used to grey out vendors tied elsewhere. */
  selectedDestination?: Destination | null;
  vendorDestinationName?: string | null;
  /** Reply details, for venue-category cards only. */
  venueDetails?: VenueDetails | null;
}) {
  const budgetFit = getBudgetFit(vendor.priceQuote, categoryBudgeted);
  const [isPending, startTransition] = useTransition();
  const isFromOtherDestination = Boolean(
    selectedDestination && vendor.destinationId && vendor.destinationId !== selectedDestination.id,
  );

  function handleToggleSelected() {
    startTransition(async () => {
      await setVendorSelected(vendor.id, category, !vendor.isSelected);
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete "${vendor.name}"?`)) return;
    startTransition(async () => {
      await deleteVendor(vendor.id, category);
    });
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 backdrop-blur-xl backdrop-saturate-150 ${
        vendor.isSelected ? "border-olive bg-olive/10" : "border-white/50 bg-white/45"
      } ${isFromOtherDestination ? "opacity-50 grayscale" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-ink">{vendor.name}</h3>
            {vendor.isSelected && (
              <span className="inline-flex items-center gap-1 rounded-full bg-olive px-2 py-0.5 text-xs font-medium text-whitewash">
                ✓ Selected vendor
              </span>
            )}
            {isFromOtherDestination && vendorDestinationName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-foreground/60">
                For {vendorDestinationName}
              </span>
            )}
          </div>
          {vendor.contactName && (
            <p className="mt-0.5 text-sm text-foreground/60">{vendor.contactName}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/vendors/${category}/${vendor.id}/edit`}
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
        {vendor.email && <div>{vendor.email}</div>}
        {vendor.phone && <div>{vendor.phone}</div>}
        {vendor.website && (
          <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-aegean hover:underline">
            {vendor.website}
          </a>
        )}
        {vendor.priceQuote != null && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">€{vendor.priceQuote.toLocaleString()}</span>
            {budgetFit && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                  budgetFit.status === "over"
                    ? "bg-terracotta/15 text-terracotta"
                    : "bg-olive/15 text-olive"
                }`}
              >
                {budgetFit.status === "over"
                  ? `€${budgetFit.overBy.toLocaleString()} over budget`
                  : "In budget"}
              </span>
            )}
          </div>
        )}
        {venueDetails && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-medium text-foreground/70">
              {OUTREACH_STATUS_LABELS[venueDetails.outreachStatus]}
            </span>
            {hireInclVat(venueDetails) !== null && (
              <span className="font-medium text-ink">
                €{Math.round(hireInclVat(venueDetails)!).toLocaleString()} hire incl. VAT
              </span>
            )}
            {venueDetails.maxCapacity !== null && (
              <span className="text-xs">up to {venueDetails.maxCapacity} guests</span>
            )}
          </div>
        )}
        {vendor.notes && <div className="text-foreground/60 italic">{vendor.notes}</div>}
      </dl>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input
            type="checkbox"
            checked={vendor.isSelected}
            onChange={handleToggleSelected}
            disabled={isPending}
            className="h-4 w-4 rounded border-border text-olive focus:ring-olive"
          />
          Selected vendor
        </label>
        {category !== "venue" && (
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

      {vendor.isSelected && <BookingStatusForm vendor={vendor} category={category} />}
    </div>
  );
}
