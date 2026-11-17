import "server-only";
import { SAN_MARCOS_VENDOR_ID } from "@/lib/venues/seed-ids";
import type { CostItem, ServiceEntry, VenueProfile, VenueRating } from "@/lib/venues/analysis/types";
import { defaultCostItem, defaultProfile, defaultService } from "./defaults";

/**
 * In-memory structured venue data used only when LOCAL_TEST_BYPASS_AUTH is
 * set. Resets on every dev server restart. Seeded with what we've read in
 * the San Marcos reply: hire fee + VAT, security and cleaning included,
 * catering from an approved list.
 */
const replied = { source: "email" as const, confidence: "confirmed_by_venue" as const, sourceDate: "2026-10-28" };

let costItems: CostItem[] = [
  {
    ...defaultCostItem(SAN_MARCOS_VENDOR_ID, "venue_hire"),
    amount: 6000,
    vat: "excluded",
    notes: "Saturday and public-holiday rate, exclusive 24h hire.",
    ...replied,
  },
];

let services: ServiceEntry[] = [
  { ...defaultService(SAN_MARCOS_VENDOR_ID, "catering"), status: "not_provided", notes: "Approved list of catering companies; no in-house catering.", ...replied },
  { ...defaultService(SAN_MARCOS_VENDOR_ID, "security"), status: "included", notes: "Included in the hire fee.", ...replied },
  { ...defaultService(SAN_MARCOS_VENDOR_ID, "cleaning"), status: "included", notes: "Included in the hire fee.", ...replied },
  { ...defaultService(SAN_MARCOS_VENDOR_ID, "wedding_coordinator"), status: "not_provided", notes: "No wedding planner.", ...replied },
  { ...defaultService(SAN_MARCOS_VENDOR_ID, "accommodation"), status: "not_provided", notes: "Hotels and holiday flats nearby.", ...replied },
];

let profiles: VenueProfile[] = [
  {
    ...defaultProfile(SAN_MARCOS_VENDOR_ID),
    fieldMeta: {
      availableDates: { confidence: "confirmed_by_venue", source: "Email", date: "2026-10-28" },
      hireHours: { confidence: "confirmed_by_venue", source: "Email", date: "2026-10-28" },
      exclusiveHire: { confidence: "confirmed_by_venue", source: "Email", date: "2026-10-28" },
      vatPercent: { confidence: "confirmed_by_venue", source: "Email", date: "2026-10-28" },
    },
  },
];

let ratings: VenueRating[] = [];

const forVendor = <T extends { vendorId: string }>(list: T[], vendorId: string) =>
  list.filter((entry) => entry.vendorId === vendorId);

export const mockListCostItems = (vendorId?: string) => (vendorId ? forVendor(costItems, vendorId) : costItems);
export const mockListServices = (vendorId?: string) => (vendorId ? forVendor(services, vendorId) : services);
export const mockListProfiles = (vendorId?: string) => (vendorId ? forVendor(profiles, vendorId) : profiles);
export const mockListRatings = (vendorId?: string) => (vendorId ? forVendor(ratings, vendorId) : ratings);

export function mockUpsertCostItems(items: CostItem[]): void {
  for (const item of items) {
    costItems = costItems.some((e) => e.vendorId === item.vendorId && e.itemKey === item.itemKey)
      ? costItems.map((e) => (e.vendorId === item.vendorId && e.itemKey === item.itemKey ? item : e))
      : [...costItems, item];
  }
}

export function mockUpsertServices(entries: ServiceEntry[]): void {
  for (const entry of entries) {
    services = services.some((e) => e.vendorId === entry.vendorId && e.serviceKey === entry.serviceKey)
      ? services.map((e) => (e.vendorId === entry.vendorId && e.serviceKey === entry.serviceKey ? entry : e))
      : [...services, entry];
  }
}

export function mockUpsertProfile(profile: VenueProfile): void {
  profiles = profiles.some((e) => e.vendorId === profile.vendorId)
    ? profiles.map((e) => (e.vendorId === profile.vendorId ? profile : e))
    : [...profiles, profile];
}

export function mockSetRating(rating: VenueRating | { vendorId: string; criterionKey: string; score: null }): void {
  ratings = ratings.filter((e) => !(e.vendorId === rating.vendorId && e.criterionKey === rating.criterionKey));
  if (rating.score !== null) ratings = [...ratings, rating as VenueRating];
}
