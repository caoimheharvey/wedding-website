import type { VenueDetails } from "../types";
import { ASSUMPTIONS, MIN_COVERAGE_TO_RANK } from "./assumptions";
import {
  ACCOMMODATION_SERVICE_KEYS,
  FOOD_SERVICE_KEYS,
  OPERATIONS_SERVICE_KEYS,
  RATING_CRITERIA,
  SERVICE_BY_KEY,
} from "./catalogue";
import type { Range } from "./scenarios";
import type { VenueAnalysis } from "./analyse";
import { DOG_POLICY_LABELS, normalizeDogPolicy, type ServiceEntry, type ServiceStatus, type VenueProfile, type VenueRating } from "./types";
import { formatCurrency } from "@/lib/budget/format";

// Three separate rankings. Every criterion keeps its parts and evidence so the
// "why" is always visible, and a criterion with no data is left unscored
// rather than defaulted.

export interface RankInput {
  analysis: VenueAnalysis;
  details: VenueDetails | null;
  profile: VenueProfile | null;
  ratings: VenueRating[];
  services: ServiceEntry[];
}

export interface CriterionPart {
  source: "computed" | "manual";
  /** 0–5 */
  score: number;
  evidence: string;
}

export interface CriterionResult {
  key: string;
  label: string;
  weight: number;
  /** Mean of the available parts, 0–5. Null = not enough information. */
  score: number | null;
  parts: CriterionPart[];
}

export interface ScoreEntry {
  vendorId: string;
  name: string;
  /** 0–100, normalised over the criteria that could be scored. */
  score: number | null;
  /** Share of the total weight that was scored, 0–1. */
  coverage: number;
  infoConfidence: number;
  rank: number | null;
  criteria: CriterionResult[];
}

export interface CheapestEntry {
  vendorId: string;
  name: string;
  rank: number | null;
  total: Range;
  perAdult: Range;
  completeness: number;
  unpriced: number;
  note: string | null;
}

export interface Rankings {
  cheapest: CheapestEntry[];
  allAround: ScoreEntry[];
  fit: ScoreEntry[];
}

// ---- Weights --------------------------------------------------------------

export const ALL_AROUND_WEIGHTS = [
  { key: "cost_value", label: "Cost and value", weight: 25 },
  { key: "food_drinks", label: "Food and drinks", weight: 15 },
  { key: "coordination_services", label: "Coordination and included services", weight: 20 },
  { key: "guest_experience", label: "Guest experience and accommodation", weight: 15 },
  { key: "atmosphere_setting", label: "Atmosphere and setting", weight: 15 },
  { key: "flexibility_logistics", label: "Flexibility and logistics", weight: 10 },
] as const;

export const FIT_WEIGHTS = [
  { key: "atmosphere", label: "Genuine Mediterranean atmosphere", weight: 12 },
  { key: "setting", label: "Outdoor ceremony and setting", weight: 12 },
  { key: "food", label: "Good food and drinks", weight: 8 },
  { key: "party", label: "Space for an evening party", weight: 10 },
  { key: "capacity", label: "Right size for 80 adults", weight: 8 },
  { key: "logistics", label: "Guest logistics (direct flights from Amsterdam)", weight: 12 },
  { key: "english", label: "English-speaking planning support and staff", weight: 8 },
  { key: "dog", label: "Dog-friendly", weight: 8 },
  { key: "accommodation", label: "Meaningful accommodation options", weight: 8 },
  { key: "budget", label: "Within the €25,000–€30,000 budget", weight: 14 },
] as const;

// ---- Scoring helpers ------------------------------------------------------

const STATUS_SCORE: Partial<Record<ServiceStatus, number>> = {
  included: 5,
  additional: 3,
  not_provided: 1,
  not_permitted: 0,
};

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const round1 = (value: number) => Math.round(value * 10) / 10;

interface Context extends RankInput {
  cheapestRealistic: number | null;
}

function servicesPart(keys: string[], services: ServiceEntry[]): CriterionPart | null {
  const byKey = new Map(services.map((entry) => [entry.serviceKey, entry.status]));
  const known = keys.flatMap((key) => {
    const score = STATUS_SCORE[byKey.get(key) ?? "unknown"];
    return score === undefined ? [] : [{ key, score }];
  });
  if (known.length === 0) return null;
  return {
    source: "computed",
    score: mean(known.map((entry) => entry.score)),
    evidence: `${known.length} of ${keys.length} services confirmed: ${known
      .map((entry) => `${SERVICE_BY_KEY.get(entry.key)?.label ?? entry.key} (${byKey.get(entry.key)?.replace("_", " ")})`)
      .join(", ")}`,
  };
}

function manualPart(ctx: Context, key: string): CriterionPart | null {
  const rating = ctx.ratings.find((entry) => entry.criterionKey === key);
  if (!rating) return null;
  const label = RATING_CRITERIA.find((entry) => entry.key === key)?.label ?? key;
  return {
    source: "manual",
    score: rating.score,
    evidence: `Our rating for "${label}": ${rating.score}/5${rating.reasoning ? `: ${rating.reasoning}` : ""}`,
  };
}

/** Several computed sub-scores count as one computed part. */
function computedPart(subParts: (CriterionPart | null)[]): CriterionPart | null {
  const present = subParts.filter((part): part is CriterionPart => part !== null);
  if (present.length === 0) return null;
  return {
    source: "computed",
    score: mean(present.map((part) => part.score)),
    evidence: present.map((part) => part.evidence).join("; "),
  };
}

const single = (score: number, evidence: string): CriterionPart => ({ source: "computed", score, evidence });

function criterion(key: string, label: string, weight: number, parts: (CriterionPart | null)[]): CriterionResult {
  const present = parts.filter((part): part is CriterionPart => part !== null);
  return { key, label, weight, score: present.length === 0 ? null : round1(mean(present.map((p) => p.score))), parts: present };
}

// ---- Shared computed parts ------------------------------------------------

const foodCriterion = (ctx: Context, key: string, label: string, weight: number) =>
  criterion(key, label, weight, [servicesPart(FOOD_SERVICE_KEYS, ctx.services), manualPart(ctx, "food_quality")]);

const accommodationCriterion = (ctx: Context, key: string, label: string, weight: number, manualKey: string) =>
  criterion(key, label, weight, [servicesPart(ACCOMMODATION_SERVICE_KEYS, ctx.services), manualPart(ctx, manualKey)]);

function flightPart(ctx: Context): CriterionPart | null {
  const flight = ctx.profile?.directFlightAmsterdam;
  if (flight === "yes") return single(5, "Direct flight from Amsterdam");
  if (flight === "no") return single(0.5, "No direct flight from Amsterdam");
  return null;
}

// ---- All-around -----------------------------------------------------------

function allAroundCriteria(ctx: Context): CriterionResult[] {
  const { analysis, details } = ctx;
  const total = analysis.scenarios.B.total.mid;

  const cost =
    analysis.priceRankable && ctx.cheapestRealistic !== null && total > 0
      ? single(
          5 * Math.min(1, ctx.cheapestRealistic / total),
          `Realistic total ${formatCurrency(total)} vs cheapest comparable ${formatCurrency(ctx.cheapestRealistic)}`,
        )
      : null;

  const coordinationLevel = details?.coordination
    ? single(
        { none: 1, space_only: 3, full: 5 }[details.coordination],
        `Coordination level: ${details.coordination.replace("_", " ")}`,
      )
    : null;

  const catering = details?.cateringType
    ? single(
        { in_house: 1.5, approved_list: 3, external_allowed: 5 }[details.cateringType],
        `Catering: ${details.cateringType.replace("_", " ")}`,
      )
    : null;
  const exclusive =
    details?.exclusiveHire === null || details?.exclusiveHire === undefined
      ? null
      : single(details.exclusiveHire ? 5 : 2, details.exclusiveHire ? "Exclusive hire" : "Shared venue");
  const rain = servicesPart(["rain_backup"], ctx.services);

  return [
    criterion("cost_value", "Cost and value", 25, [cost]),
    foodCriterion(ctx, "food_drinks", "Food and drinks", 15),
    criterion("coordination_services", "Coordination and included services", 20, [
      computedPart([servicesPart(OPERATIONS_SERVICE_KEYS, ctx.services), coordinationLevel]),
      manualPart(ctx, "coordination_quality"),
    ]),
    accommodationCriterion(ctx, "guest_experience", "Guest experience and accommodation", 15, "guest_experience"),
    criterion("atmosphere_setting", "Atmosphere and setting", 15, [manualPart(ctx, "atmosphere"), manualPart(ctx, "setting")]),
    criterion("flexibility_logistics", "Flexibility and logistics", 10, [
      computedPart([rain, catering, exclusive, flightPart(ctx)]),
      manualPart(ctx, "flexibility"),
      manualPart(ctx, "logistics"),
    ]),
  ].map((result, index) => ({ ...result, weight: ALL_AROUND_WEIGHTS[index].weight }));
}

// ---- Best fit -------------------------------------------------------------

function capacityPart(ctx: Context): CriterionPart | null {
  const capacity = ctx.profile?.receptionCapacity ?? ctx.details?.maxCapacity ?? null;
  if (capacity === null || capacity <= 0) return null;
  const adults = ctx.analysis.adults;
  if (capacity < adults) return single(0, `Capacity ${capacity} is below ${adults} adults`);
  const ratio = adults / capacity;
  const score = ratio >= 0.5 ? 5 : ratio >= 0.33 ? 4 : ratio >= 0.2 ? 2.5 : 1;
  return single(score, `${adults} adults in a space for ${capacity} (${Math.round(ratio * 100)}% full)`);
}

function budgetPart(ctx: Context): CriterionPart | null {
  if (!ctx.analysis.priceRankable) return null;
  const total = ctx.analysis.scenarios.B.total.mid;
  const { budgetTargetLow: low, budgetTargetHigh: high } = ASSUMPTIONS;
  const score = total <= low ? 5 : total <= high ? 4 : total <= high * 1.1 ? 2.5 : total <= high * 1.2 ? 1 : 0;
  return single(score, `Realistic total ${formatCurrency(total)} against a ${formatCurrency(low)}–${formatCurrency(high)} target`);
}

function fitCriteria(ctx: Context): CriterionResult[] {
  const { profile } = ctx;
  const english =
    profile && profile.englishSupport !== "unknown"
      ? single({ confirmed: 5, partial: 3, no: 0.5 }[profile.englishSupport], `English support: ${profile.englishSupport}`)
      : null;
  const dogPolicy = normalizeDogPolicy(profile?.dogPolicy);
  const dog =
    dogPolicy !== "unknown"
      ? single(
          { welcome: 5, limited: 3.5, not_allowed: 0 }[dogPolicy],
          `Dogs at the wedding: ${DOG_POLICY_LABELS[dogPolicy].toLowerCase()}`,
        )
      : null;

  const results = [
    criterion("atmosphere", "", 0, [manualPart(ctx, "atmosphere")]),
    criterion("setting", "", 0, [manualPart(ctx, "setting")]),
    foodCriterion(ctx, "food", "", 0),
    criterion("party", "", 0, [manualPart(ctx, "party_space")]),
    criterion("capacity", "", 0, [capacityPart(ctx), manualPart(ctx, "capacity_feel")]),
    criterion("logistics", "", 0, [flightPart(ctx), manualPart(ctx, "logistics")]),
    criterion("english", "", 0, [english, manualPart(ctx, "english_support")]),
    criterion("dog", "", 0, [dog]),
    accommodationCriterion(ctx, "accommodation", "", 0, "accommodation"),
    criterion("budget", "", 0, [budgetPart(ctx)]),
  ];
  return results.map((result, index) => ({
    ...result,
    label: FIT_WEIGHTS[index].label,
    weight: FIT_WEIGHTS[index].weight,
  }));
}

// ---- Ranking --------------------------------------------------------------

function toEntry(input: RankInput, criteria: CriterionResult[]): ScoreEntry {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
  const scored = criteria.filter((c) => c.score !== null);
  const scoredWeight = scored.reduce((sum, c) => sum + c.weight, 0);
  return {
    vendorId: input.analysis.vendorId,
    name: input.analysis.name,
    score:
      scoredWeight === 0
        ? null
        : Math.round((scored.reduce((sum, c) => sum + c.weight * (c.score as number), 0) / scoredWeight / 5) * 100),
    coverage: totalWeight === 0 ? 0 : scoredWeight / totalWeight,
    infoConfidence: input.analysis.infoConfidence,
    rank: null,
    criteria,
  };
}

function assignRanks(entries: ScoreEntry[]): ScoreEntry[] {
  const ranked = entries
    .filter((entry) => entry.score !== null && entry.coverage >= MIN_COVERAGE_TO_RANK)
    .sort((a, b) => (b.score as number) - (a.score as number));
  ranked.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  return [...entries].sort(
    (a, b) =>
      (a.rank ?? Infinity) - (b.rank ?? Infinity) || (b.score ?? -1) - (a.score ?? -1) || a.name.localeCompare(b.name),
  );
}

export function rankVenues(inputs: RankInput[]): Rankings {
  const comparable = inputs.filter((input) => input.analysis.priceRankable);
  const cheapestRealistic = comparable.length
    ? Math.min(...comparable.map((input) => input.analysis.scenarios.B.total.mid))
    : null;

  const cheapest: CheapestEntry[] = inputs.map(({ analysis }) => ({
    vendorId: analysis.vendorId,
    name: analysis.name,
    rank: null,
    total: analysis.scenarios.B.total,
    perAdult: analysis.scenarios.B.perAdult,
    completeness: analysis.completeness,
    unpriced: analysis.unpricedRequired,
    note: analysis.priceRankable
      ? analysis.unpricedRequired > 0
        ? `${analysis.unpricedRequired} still unpriced: the real total will be higher`
        : null
      : `Only ${Math.round(analysis.completeness * 100)}% of the realistic wedding is priced: not comparable yet`,
  }));
  cheapest
    .filter((entry) => inputs.find((i) => i.analysis.vendorId === entry.vendorId)?.analysis.priceRankable)
    .sort((a, b) => a.total.mid - b.total.mid)
    .forEach((entry, index) => {
      entry.rank = index + 1;
    });
  cheapest.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || a.name.localeCompare(b.name));

  const withContext = inputs.map((input): Context => ({ ...input, cheapestRealistic }));
  return {
    cheapest,
    allAround: assignRanks(withContext.map((ctx) => toEntry(ctx, allAroundCriteria(ctx)))),
    fit: assignRanks(withContext.map((ctx) => toEntry(ctx, fitCriteria(ctx)))),
  };
}
