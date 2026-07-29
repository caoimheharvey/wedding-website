import Link from "next/link";
import { notFound } from "next/navigation";
import { listCategories } from "@/lib/categories/queries";
import { listDestinations } from "@/lib/destinations/queries";
import { VendorForm } from "../_components/vendor-form";

export default async function NewVendorPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [categories, destinations] = await Promise.all([listCategories(), listDestinations()]);
  const categoryLabel = categories.find((c) => c.id === category)?.label;
  if (!categoryLabel) notFound();
  const selectedDestinationId = destinations.find((d) => d.isSelected)?.id ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/vendors/${category}`} className="text-sm text-aegean hover:underline">
          ← Back to {categoryLabel}
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">
          Add a {categoryLabel.toLowerCase()} vendor
        </h1>
      </div>
      <VendorForm category={category} destinations={destinations} selectedDestinationId={selectedDestinationId} />
    </div>
  );
}
