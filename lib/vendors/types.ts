// Vendors and budget items share one category taxonomy (lib/categories.ts)
// so a budget category links straight through to its vendors. Re-exported
// under the vendor-familiar names to avoid a wider rename across this module.
export {
  WEDDING_CATEGORIES as VENDOR_CATEGORIES,
  WEDDING_CATEGORY_LABELS as VENDOR_CATEGORY_LABELS,
  type WeddingCategory as VendorCategory,
} from "@/lib/categories";
import type { WeddingCategory } from "@/lib/categories";

export interface Vendor {
  id: string;
  category: WeddingCategory;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  priceQuote: number | null;
  notes: string | null;
  isSelected: boolean;
  depositPaid: boolean;
  depositAmount: number | null;
  depositDate: string | null;
  fullyPaid: boolean;
  fullyPaidAmount: number | null;
  fullyPaidDate: string | null;
  createdAt: string;
  updatedAt: string;
}
