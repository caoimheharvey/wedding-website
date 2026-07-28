"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteVendor, setVendorSelected } from "@/lib/vendors/actions";
import type { Vendor, VendorCategory } from "@/lib/vendors/types";
import { BookingStatusForm } from "./booking-status-form";

export function VendorCard({
  vendor,
  category,
  isComparing,
  onToggleCompare,
  compareDisabled,
}: {
  vendor: Vendor;
  category: VendorCategory;
  isComparing: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
}) {
  const [isPending, startTransition] = useTransition();

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
      className={`flex flex-col gap-3 rounded-lg border p-4 ${
        vendor.isSelected ? "border-olive bg-olive/5" : "border-border bg-surface"
      }`}
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
          <div className="font-medium text-ink">€{vendor.priceQuote.toLocaleString()}</div>
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

      {vendor.isSelected && <BookingStatusForm vendor={vendor} category={category} />}
    </div>
  );
}
