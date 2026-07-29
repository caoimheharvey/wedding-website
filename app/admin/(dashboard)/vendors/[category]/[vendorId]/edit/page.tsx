import Link from "next/link";
import { notFound } from "next/navigation";
import { getVendorById } from "@/lib/vendors/queries";
import { listCategories } from "@/lib/categories/queries";
import { listDestinations } from "@/lib/destinations/queries";
import { VendorForm } from "../../_components/vendor-form";

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
    </div>
  );
}
