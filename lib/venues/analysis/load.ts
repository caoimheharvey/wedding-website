import "server-only";
import { listVendorsByCategory } from "@/lib/vendors/queries";
import { listVenueDetails } from "@/lib/venues/queries";
import {
  listVenueCostItems,
  listVenueProfiles,
  listVenueRatings,
  listVenueServices,
} from "@/lib/venues/costs/queries";
import type { VenueDecisionInput } from "./decision";

/** Loads every venue with its structured data. Analysis itself runs wherever it's needed (pure). */
export async function loadVenueDecisionInputs(): Promise<VenueDecisionInput[]> {
  const [vendors, details, costItems, services, profiles, ratings] = await Promise.all([
    listVendorsByCategory("venue"),
    listVenueDetails(),
    listVenueCostItems(),
    listVenueServices(),
    listVenueProfiles(),
    listVenueRatings(),
  ]);

  return vendors.map((vendor) => ({
    vendorId: vendor.id,
    name: vendor.name,
    details: details.find((entry) => entry.vendorId === vendor.id) ?? null,
    costItems: costItems.filter((entry) => entry.vendorId === vendor.id),
    services: services.filter((entry) => entry.vendorId === vendor.id),
    profile: profiles.find((entry) => entry.vendorId === vendor.id) ?? null,
    ratings: ratings.filter((entry) => entry.vendorId === vendor.id),
  }));
}
