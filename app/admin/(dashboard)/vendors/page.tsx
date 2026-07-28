import Link from "next/link";
import { countVendorsByCategory } from "@/lib/vendors/queries";
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS } from "@/lib/vendors/types";

export default async function VendorsPage() {
  const counts = await countVendorsByCategory();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Vendors</h1>
        <p className="text-sm text-foreground/60">
          Pick a category to see the vendors you&apos;re considering, compare them, and track
          booking status once you&apos;ve chosen one.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {VENDOR_CATEGORIES.map((category) => {
          const entry = counts[category];
          return (
            <Link
              key={category}
              href={`/admin/vendors/${category}`}
              className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-4 transition hover:border-aegean"
            >
              <span className="font-display text-lg text-ink">
                {VENDOR_CATEGORY_LABELS[category]}
              </span>
              <span className="text-xs text-foreground/50">
                {entry?.total ? `${entry.total} vendor${entry.total === 1 ? "" : "s"}` : "No vendors yet"}
              </span>
              {entry?.selectedName && (
                <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-olive/15 px-2 py-0.5 text-xs font-medium text-olive">
                  ✓ {entry.selectedName}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
