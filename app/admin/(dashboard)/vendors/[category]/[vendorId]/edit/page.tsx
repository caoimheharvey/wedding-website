import Link from "next/link";
import { notFound } from "next/navigation";
import { getVendorById } from "@/lib/vendors/queries";
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS, type VendorCategory } from "@/lib/vendors/types";
import { VendorForm } from "../../_components/vendor-form";

function isVendorCategory(value: string): value is VendorCategory {
  return (VENDOR_CATEGORIES as readonly string[]).includes(value);
}

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ category: string; vendorId: string }>;
}) {
  const { category, vendorId } = await params;
  if (!isVendorCategory(category)) notFound();

  const vendor = await getVendorById(vendorId);
  if (!vendor || vendor.category !== category) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href={`/admin/vendors/${category}`} className="text-sm text-aegean hover:underline">
          ← Back to {VENDOR_CATEGORY_LABELS[category]}
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink">Edit {vendor.name}</h1>
      </div>
      <VendorForm category={category} vendor={vendor} />
    </div>
  );
}
