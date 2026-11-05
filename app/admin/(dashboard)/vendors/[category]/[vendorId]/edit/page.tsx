import Link from "next/link";
import { notFound } from "next/navigation";
import { getVendorById } from "@/lib/vendors/queries";
import { listCategories } from "@/lib/categories/queries";
import { listDestinations } from "@/lib/destinations/queries";
import { getVenueDetails, listVenueDocuments, listVenueUpdates } from "@/lib/venues/queries";
import { VendorForm } from "../../_components/vendor-form";
import { VenueDetailsEditor } from "../../_components/venue-details-editor";
import { VenueDocuments } from "../../_components/venue-documents";
import { VenueHistory } from "../../_components/venue-history";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ category: string; vendorId: string }>;
}) {
  const { category, vendorId } = await params;

  const [vendor, categories, destinations] = await Promise.all([
    getVendorById(vendorId),
    listCategories(),
    listDestinations(),
  ]);
  const categoryLabel = categories.find((c) => c.id === category)?.label;
  if (!categoryLabel || !vendor || vendor.category !== category) notFound();
  const selectedDestinationId = destinations.find((d) => d.isSelected)?.id ?? null;
  const isVenue = category === "venue";
  const [venueDetails, venueDocuments, venueUpdates] = isVenue
    ? await Promise.all([
        getVenueDetails(vendorId),
        listVenueDocuments(vendorId),
        listVenueUpdates(vendorId),
      ])
    : [null, [], []];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/vendors/${category}`} className="text-sm text-aegean hover:underline">
          ← Back to {categoryLabel}
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Edit {vendor.name}</h1>
      </div>
      <VendorForm
        category={category}
        vendor={vendor}
        destinations={destinations}
        selectedDestinationId={selectedDestinationId}
      />
      {isVenue && (
        <>
          <hr className="border-border" />
          <VenueDetailsEditor
            // Remount after each save so "was: …" hints and the update box reset
            // against the newly saved values.
            key={`${venueDetails?.updatedAt ?? "new"}-${venueUpdates.length}`}
            vendorId={vendorId}
            category={category}
            details={venueDetails}
            today={today}
          />
          <hr className="border-border" />
          <VenueHistory updates={venueUpdates} today={today} />
          <hr className="border-border" />
          <VenueDocuments vendorId={vendorId} category={category} documents={venueDocuments} />
        </>
      )}
    </div>
  );
}
