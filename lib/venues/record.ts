import "server-only";
import { getVendorById } from "@/lib/vendors/queries";
import { describeDogPolicy } from "@/lib/venues/analysis/types";
import { auditVenueRecord, type AuditFinding } from "./audit";
import { defaultProfile } from "./costs/defaults";
import {
  listVenueCostItems,
  listVenueProfiles,
  listVenueRatings,
  listVenueServices,
} from "./costs/queries";
import { getVenueDetails, listVenueUpdates } from "./queries";

/**
 * Everything the website stores about one venue, structured fields first.
 * This is the canonical record: anything mirrored elsewhere (Notion, notes)
 * should match it, and the audit says where it doesn't.
 */
export async function loadVenueRecord(vendorId: string) {
  const vendor = await getVendorById(vendorId);
  if (!vendor) return null;

  const [details, profiles, costItems, services, ratings, history] = await Promise.all([
    getVenueDetails(vendorId),
    listVenueProfiles(vendorId),
    listVenueCostItems(vendorId),
    listVenueServices(vendorId),
    listVenueRatings(vendorId),
    listVenueUpdates(vendorId),
  ]);
  const profile = profiles[0] ?? defaultProfile(vendorId);
  const audit: AuditFinding[] = auditVenueRecord({ vendor, details, profile: profiles[0] ?? null, costItems, services });

  return {
    vendor,
    venueDetails: details,
    profile,
    /** The dog fields in words, exactly as the website shows them. */
    dogPolicySummary: describeDogPolicy({ policy: profile.dogPolicy, accommodation: profile.dogAccommodation }),
    costItems,
    services,
    ratings,
    history,
    auditFindings: audit,
  };
}
