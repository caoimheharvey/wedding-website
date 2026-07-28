import Link from "next/link";
import { notFound } from "next/navigation";
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS, type VendorCategory } from "@/lib/vendors/types";
import { VendorForm } from "../_components/vendor-form";

function isVendorCategory(value: string): value is VendorCategory {
  return (VENDOR_CATEGORIES as readonly string[]).includes(value);
}

export default async function NewVendorPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!isVendorCategory(category)) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/vendors/${category}`} className="text-sm text-aegean hover:underline">
          ← Back to {VENDOR_CATEGORY_LABELS[category]}
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">
          Add a {VENDOR_CATEGORY_LABELS[category].toLowerCase()} vendor
        </h1>
      </div>
      <VendorForm category={category} />
    </div>
  );
}
