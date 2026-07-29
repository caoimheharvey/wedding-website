// Vendors and budget items share one category taxonomy (lib/categories),
// which is admin-editable (an "Add Category" button on Planning) and
// therefore DB-backed rather than a fixed compile-time list — category ids
// are just strings, validated at write time against lib/categories/queries.

export interface Vendor {
  id: string;
  category: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  priceQuote: number | null;
  notes: string | null;
  /** Which destination this vendor is for — null means not tied to one yet. */
  destinationId: string | null;
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
