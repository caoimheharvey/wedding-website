import { formatCurrency } from "@/lib/budget/format";
import type { VenueDetails } from "../types";
import { MIN_COMPLETENESS_TO_RANK } from "./assumptions";
import { COST_ITEM_BY_KEY, SERVICE_CATALOGUE } from "./catalogue";
import { computeScenario, type ScenarioResult } from "./scenarios";
import {
  CONFIDENCE_WEIGHT,
  COST_BASIS_LABELS,
  VAT_LABELS,
  type CostItem,
  type ScenarioId,
  type ServiceEntry,
  type ServiceStatus,
  type VenueProfile,
  type VenueRating,
} from "./types";

export interface VenueAnalysisInput {
  vendorId: string;
  name: string;
  details: VenueDetails | null;
  costItems: CostItem[];
  services: ServiceEntry[];
  profile: VenueProfile | null;
  ratings: VenueRating[];
  adults: number;
}

export interface ExclusionEntry {
  serviceKey: string;
  label: string;
  status: ServiceStatus;
  /** For additional-cost services: the linked price, or null when still unpriced. */
  priceText: string | null;
  notes: string | null;
}

export interface Exclusions {
  /** Confirmed as not provided or not permitted. */
  notProvided: ExclusionEntry[];
  /** Available, but only at extra cost. */
  additionalCost: ExclusionEntry[];
  /** Not yet confirmed: NOT a confirmed exclusion. */
  unconfirmed: ExclusionEntry[];
}

export interface ServiceCounts {
  included: number;
  additional: number;
  notProvided: number;
  unknown: number;
}

export interface Question {
  text: string;
  source: "auto" | "manual";
}

export interface VenueAnalysis {
  vendorId: string;
  name: string;
  adults: number;
  scenarios: Record<ScenarioId, ScenarioResult>;
  counts: ServiceCounts;
  exclusions: Exclusions;
  questions: Question[];
  /** 0–1: how much of what we know is confirmed rather than estimated or missing. */
  infoConfidence: number;
  /** Scenario B completeness, 0–1. */
  completeness: number;
  /** Enough of the realistic wedding is priced to rank on cost. */
  priceRankable: boolean;
  confirmedMandatory: number;
  mandatoryAdditional: number;
  estimatedAdditional: number;
  optionalSelected: number;
  unpricedRequired: number;
  missingOrUnconfirmed: number;
}

const BASE_LINES = new Set(["venue_hire", "adult_menu", "children_menu"]);

function describePrice(row: CostItem): string {
  if (row.amount === null) return "";
  const range =
    row.amountHigh !== null && row.amountHigh !== row.amount
      ? `${formatCurrency(row.amount)}–${formatCurrency(row.amountHigh)}`
      : formatCurrency(row.amount);
  const unit = row.basis === "fixed" ? "" : ` ${COST_BASIS_LABELS[row.basis].toLowerCase()}`;
  return `${range}${unit}, ${VAT_LABELS[row.vat].toLowerCase()}`;
}

function buildExclusions(services: ServiceEntry[], costItems: CostItem[]): Exclusions {
  const entries = new Map(services.map((entry) => [entry.serviceKey, entry]));
  const rows = new Map(costItems.map((row) => [row.itemKey, row]));
  const result: Exclusions = { notProvided: [], additionalCost: [], unconfirmed: [] };

  for (const def of SERVICE_CATALOGUE) {
    const entry = entries.get(def.key);
    const status = entry?.status ?? "unknown";
    const costKey = entry?.costItemKey ?? def.defaultCostKey;
    const row = costKey ? rows.get(costKey) : undefined;
    const base = {
      serviceKey: def.key,
      label: def.label,
      status,
      priceText: row && row.amount !== null ? describePrice(row) : null,
      notes: entry?.notes ?? null,
    };
    if (status === "not_provided" || status === "not_permitted") result.notProvided.push(base);
    else if (status === "additional") result.additionalCost.push(base);
    else if (status === "unknown") result.unconfirmed.push(base);
  }
  return result;
}

const KEY_FIELDS: { key: string; present: (details: VenueDetails) => boolean }[] = [
  { key: "availableDates", present: (d) => Boolean(d.availableDates) },
  { key: "maxCapacity", present: (d) => d.maxCapacity !== null },
  { key: "minGuests", present: (d) => d.minGuests !== null },
  { key: "minSpend", present: (d) => d.minSpend !== null },
  { key: "hireHours", present: (d) => Boolean(d.hireHours) },
  { key: "exclusiveHire", present: (d) => d.exclusiveHire !== null },
  { key: "musicCurfew", present: (d) => Boolean(d.musicCurfew) },
  { key: "coordination", present: (d) => d.coordination !== null },
  { key: "vatPercent", present: (d) => d.rentalFeeSaturday !== null },
  { key: "depositAmount", present: (d) => d.depositAmount !== null },
  { key: "paymentSchedule", present: (d) => Boolean(d.paymentSchedule) },
  { key: "cancellationPolicy", present: (d) => Boolean(d.cancellationPolicy) },
];

function infoConfidence(input: VenueAnalysisInput): number {
  const weights: number[] = [];

  for (const row of input.costItems) {
    if (row.amount !== null) weights.push(CONFIDENCE_WEIGHT[row.confidence]);
  }
  const entries = new Map(input.services.map((entry) => [entry.serviceKey, entry]));
  for (const def of SERVICE_CATALOGUE) {
    const entry = entries.get(def.key);
    weights.push(entry && entry.status !== "unknown" ? CONFIDENCE_WEIGHT[entry.confidence] : 0);
  }
  if (input.details) {
    for (const field of KEY_FIELDS) {
      if (!field.present(input.details)) continue;
      weights.push(CONFIDENCE_WEIGHT[input.profile?.fieldMeta[field.key]?.confidence ?? "unknown"]);
    }
  }
  return weights.length === 0 ? 0 : weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
}

/** "Wedding cake" -> "wedding cake", but keep acronyms like "DJ" as they are. */
const lowerFirst = (label: string) => label.replace(/^([A-Z])(?![A-Z])/, (char) => char.toLowerCase());

function buildQuestions(input: VenueAnalysisInput, exclusions: Exclusions): Question[] {
  const auto: string[] = [];
  const rows = new Map(input.costItems.map((row) => [row.itemKey, row]));

  if (!rows.get("venue_hire") || rows.get("venue_hire")?.amount === null) auto.push("What is the venue hire fee?");
  if (!input.details?.availableDates) auto.push("Which Saturdays in September and October 2028 are available?");

  for (const entry of exclusions.unconfirmed) auto.push(`${entry.label}: included, available at extra cost, or not offered?`);
  for (const entry of exclusions.additionalCost) {
    if (entry.priceText === null) auto.push(`What does ${lowerFirst(entry.label)} cost?`);
  }

  const vatUnknown = input.costItems.filter((row) => row.amount !== null && row.vat === "unknown");
  if (vatUnknown.length > 0) {
    const labels = vatUnknown.map((row) => COST_ITEM_BY_KEY.get(row.itemKey)?.label ?? row.itemKey);
    auto.push(`Do these prices include VAT? ${labels.join(", ")}`);
  }
  for (const key of ["exclusivity_fee", "ceremony_fee"]) {
    if (!rows.has(key)) auto.push(`Is there a${key === "ceremony_fee" ? " ceremony" : "n exclusivity"} fee?`);
  }

  const profile = input.profile;
  if (!profile || profile.dogPolicy === "unknown") {
    auto.push(
      profile && profile.dogAccommodation !== "unknown"
        ? "Are dogs allowed at the ceremony and through the wedding day? (Accommodation is covered; the event itself is unconfirmed.)"
        : "Are dogs allowed at the ceremony and through the wedding day?",
    );
  }
  if (!profile || profile.englishSupport === "unknown") auto.push("Is planning support and day-of staff available in English?");
  if (!profile || profile.directFlightAmsterdam === "unknown") auto.push("Is there a direct flight from Amsterdam to the nearest airport?");

  const manual = (profile?.outstandingQuestions ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return [
    ...auto.map((text): Question => ({ text, source: "auto" })),
    ...manual.map((text): Question => ({ text, source: "manual" })),
  ];
}

export function analyseVenue(input: VenueAnalysisInput): VenueAnalysis {
  const scenarioInput = {
    details: input.details,
    costItems: input.costItems,
    services: input.services,
    profile: input.profile,
    adults: input.adults,
  };
  const scenarios = {
    A: computeScenario(scenarioInput, "A"),
    B: computeScenario(scenarioInput, "B"),
    C: computeScenario(scenarioInput, "C"),
  };
  const realistic = scenarios.B;
  const exclusions = buildExclusions(input.services, input.costItems);

  const entries = new Map(input.services.map((entry) => [entry.serviceKey, entry.status]));
  const counts: ServiceCounts = { included: 0, additional: 0, notProvided: 0, unknown: 0 };
  for (const def of SERVICE_CATALOGUE) {
    const status = entries.get(def.key) ?? "unknown";
    if (status === "included") counts.included++;
    else if (status === "additional") counts.additional++;
    else if (status === "not_provided" || status === "not_permitted") counts.notProvided++;
    else if (status === "unknown") counts.unknown++;
  }

  const priced = realistic.lines.filter((line) => line.status === "priced");
  const extras = priced.filter((line) => !BASE_LINES.has(line.key));
  const lineTotal = (line: { net: { mid: number }; vat: { mid: number } }) => line.net.mid + line.vat.mid;

  return {
    vendorId: input.vendorId,
    name: input.name,
    adults: input.adults,
    scenarios,
    counts,
    exclusions,
    questions: buildQuestions(input, exclusions),
    infoConfidence: infoConfidence(input),
    completeness: realistic.completeness,
    priceRankable: realistic.completeness >= MIN_COMPLETENESS_TO_RANK && realistic.pricedCount > 0,
    confirmedMandatory: priced.filter((l) => !l.optional && l.certainty === "confirmed").reduce((s, l) => s + lineTotal(l), 0),
    mandatoryAdditional: extras.filter((l) => !l.optional).reduce((s, l) => s + lineTotal(l), 0),
    estimatedAdditional: extras.filter((l) => l.certainty === "estimated").reduce((s, l) => s + lineTotal(l), 0),
    optionalSelected: realistic.optionalSelected,
    unpricedRequired: realistic.unpriced.length,
    missingOrUnconfirmed: realistic.unpriced.length,
  };
}
