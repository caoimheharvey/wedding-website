import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockGetVendorById, mockListVendors } from "./mock-store";
import type { Vendor, VendorCategory } from "./types";

interface VendorRow {
  id: string;
  category: VendorCategory;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  price_quote: number | null;
  notes: string | null;
  is_selected: boolean;
  deposit_paid: boolean;
  deposit_amount: number | null;
  deposit_date: string | null;
  fully_paid: boolean;
  fully_paid_amount: number | null;
  fully_paid_date: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: VendorRow): Vendor {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    priceQuote: row.price_quote,
    notes: row.notes,
    isSelected: row.is_selected,
    depositPaid: row.deposit_paid,
    depositAmount: row.deposit_amount,
    depositDate: row.deposit_date,
    fullyPaid: row.fully_paid,
    fullyPaidAmount: row.fully_paid_amount,
    fullyPaidDate: row.fully_paid_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listVendors(): Promise<Vendor[]> {
  if (isLocalTestMode()) return mockListVendors();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load vendors: ${error.message}`);
  return (data as VendorRow[]).map(mapRow);
}

export async function listVendorsByCategory(category: VendorCategory): Promise<Vendor[]> {
  const vendors = await listVendors();
  return vendors.filter((vendor) => vendor.category === category);
}

export async function getVendorById(vendorId: string): Promise<Vendor | null> {
  if (isLocalTestMode()) return mockGetVendorById(vendorId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", vendorId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load vendor: ${error.message}`);
  return data ? mapRow(data as VendorRow) : null;
}

export async function countVendorsByCategory(): Promise<
  Record<VendorCategory, { total: number; selectedName: string | null }>
> {
  const vendors = await listVendors();
  const counts = {} as Record<VendorCategory, { total: number; selectedName: string | null }>;

  for (const vendor of vendors) {
    const entry = counts[vendor.category] ?? { total: 0, selectedName: null };
    entry.total += 1;
    if (vendor.isSelected) entry.selectedName = vendor.name;
    counts[vendor.category] = entry;
  }

  return counts;
}
