/**
 * Shared between Budget and Vendors: a budget line item's category and a
 * vendor's category are the same taxonomy, so clicking through from one to
 * the other ("more detail on this budget category") is a straight lookup,
 * not a fuzzy match. Admin-editable (an "Add Category" button on Planning),
 * so this is DB-backed rather than a fixed compile-time list.
 */
export interface Category {
  id: string;
  label: string;
  orderIndex: number;
}
