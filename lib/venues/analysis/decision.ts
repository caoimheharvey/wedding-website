import type { VenueDetails } from "../types";
import { analyseVenue, type VenueAnalysis } from "./analyse";
import { rankVenues, type Rankings, type RankInput } from "./rankings";
import { describeDogPolicy, type CostItem, type DogPolicy, type ServiceEntry, type VenueProfile, type VenueRating } from "./types";

/** Everything known about one venue, as plain data (safe to pass to client components). */
export interface VenueDecisionInput {
  vendorId: string;
  name: string;
  details: VenueDetails | null;
  costItems: CostItem[];
  services: ServiceEntry[];
  profile: VenueProfile | null;
  ratings: VenueRating[];
}

export interface VenueFacts {
  location: string | null;
  availability: string | null;
  coordination: string | null;
  dogPolicy: DogPolicy;
  dogAccommodation: DogPolicy;
  /** Ready-to-show words for the two dog fields. */
  dogSummary: string;
  address: string | null;
  accommodation: string;
}

export interface DecisionData {
  adults: number;
  analyses: VenueAnalysis[];
  rankings: Rankings;
  facts: Record<string, VenueFacts>;
}

/** Pure: every venue on the same assumptions, so changing a cost, service or the adult count recomputes everything. */
export function buildDecisionData(venues: VenueDecisionInput[], adults: number): DecisionData {
  const rankInputs: RankInput[] = venues.map((venue) => ({
    analysis: analyseVenue({ ...venue, adults }),
    details: venue.details,
    profile: venue.profile,
    ratings: venue.ratings,
    services: venue.services,
  }));

  const facts: Record<string, VenueFacts> = {};
  for (const venue of venues) {
    const dogPolicy = venue.profile?.dogPolicy ?? "unknown";
    const dogAccommodation = venue.profile?.dogAccommodation ?? "unknown";
    const accommodation = venue.services.find((entry) => entry.serviceKey === "accommodation")?.status;
    facts[venue.vendorId] = {
      location: venue.profile?.location ?? null,
      availability: venue.details?.availableDates ?? null,
      coordination: venue.details?.coordination ?? null,
      dogPolicy,
      dogAccommodation,
      dogSummary: describeDogPolicy({ policy: dogPolicy, accommodation: dogAccommodation }),
      address: venue.profile?.address ?? null,
      accommodation: venue.details?.onsiteAccommodation ? "on site" : (accommodation ?? "unknown"),
    };
  }

  return {
    adults,
    analyses: rankInputs.map((input) => input.analysis),
    rankings: rankVenues(rankInputs),
    facts,
  };
}
