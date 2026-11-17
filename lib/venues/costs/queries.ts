import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import type { CostItem, ServiceEntry, VenueProfile, VenueRating } from "@/lib/venues/analysis/types";
import {
  mockListCostItems,
  mockListProfiles,
  mockListRatings,
  mockListServices,
} from "./mock-store";
import {
  mapCostRow,
  mapProfileRow,
  mapRatingRow,
  mapServiceRow,
  type CostItemRow,
  type ProfileRow,
  type RatingRow,
  type ServiceRow,
} from "./rows";

async function select<Row>(table: string, vendorId?: string): Promise<Row[]> {
  const supabase = getSupabaseAdmin();
  const query = supabase.from(table).select("*");
  const { data, error } = await (vendorId ? query.eq("vendor_id", vendorId) : query);
  if (error) throw new Error(`Failed to load ${table}: ${error.message}`);
  return data as Row[];
}

/** Pass a vendor id for one venue, or omit for every venue (the comparison dashboard). */
export async function listVenueCostItems(vendorId?: string): Promise<CostItem[]> {
  if (isLocalTestMode()) return mockListCostItems(vendorId);
  return (await select<CostItemRow>("venue_cost_items", vendorId)).map(mapCostRow);
}

export async function listVenueServices(vendorId?: string): Promise<ServiceEntry[]> {
  if (isLocalTestMode()) return mockListServices(vendorId);
  return (await select<ServiceRow>("venue_services", vendorId)).map(mapServiceRow);
}

export async function listVenueProfiles(vendorId?: string): Promise<VenueProfile[]> {
  if (isLocalTestMode()) return mockListProfiles(vendorId);
  return (await select<ProfileRow>("venue_profile", vendorId)).map(mapProfileRow);
}

export async function listVenueRatings(vendorId?: string): Promise<VenueRating[]> {
  if (isLocalTestMode()) return mockListRatings(vendorId);
  return (await select<RatingRow>("venue_ratings", vendorId)).map(mapRatingRow);
}
