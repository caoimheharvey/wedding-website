import Link from "next/link";
import type { Vendor } from "@/lib/vendors/types";

/** Vendors already tagged with this destination — the "more detail" behind the generic outreach tracker. */
export function DestinationVendors({ vendors }: { vendors: Vendor[] }) {
  if (vendors.length === 0) {
    return (
      <p className="text-xs text-foreground/50">
        No vendors linked to this destination yet — set a vendor&apos;s destination when adding or
        editing it.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {vendors.map((vendor) => (
        <div
          key={vendor.id}
          className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs"
        >
          <div className="min-w-0">
            <Link
              href={`/admin/vendors/${vendor.category}/${vendor.id}/edit`}
              className="font-medium text-aegean hover:underline"
            >
              {vendor.name}
            </Link>
            {vendor.contactName && <span className="text-foreground/50"> · {vendor.contactName}</span>}
          </div>
          {vendor.priceQuote != null && (
            <span className="shrink-0 font-medium text-ink">€{vendor.priceQuote.toLocaleString()}</span>
          )}
        </div>
      ))}
    </div>
  );
}
