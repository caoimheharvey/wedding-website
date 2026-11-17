// Shared vocabulary for the venue decision tool: what a cost line or service
// can say, and how sure we are. Pure data: no I/O, safe to import anywhere.

export const CONFIDENCE_LEVELS = [
  "confirmed_by_venue",
  "brochure",
  "indicative",
  "calculated",
  "assumption",
  "unknown",
] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  confirmed_by_venue: "Confirmed by venue",
  brochure: "Stated in brochure",
  indicative: "Indicative estimate",
  calculated: "Calculated by us",
  assumption: "Assumption",
  unknown: "Unknown / awaiting response",
};

/** How much a statement counts towards "information confidence". */
export const CONFIDENCE_WEIGHT: Record<Confidence, number> = {
  confirmed_by_venue: 1,
  brochure: 1,
  indicative: 0.6,
  calculated: 0.5,
  assumption: 0.3,
  unknown: 0,
};

/** Only these are venue-stated facts; everything else is our own number. */
export const isVenueStated = (confidence: Confidence) =>
  confidence === "confirmed_by_venue" || confidence === "brochure";

export const COST_BASES = ["fixed", "per_adult", "per_child", "per_supplier", "per_hour"] as const;
export type CostBasis = (typeof COST_BASES)[number];
export const COST_BASIS_LABELS: Record<CostBasis, string> = {
  fixed: "Fixed fee",
  per_adult: "Per adult",
  per_child: "Per child",
  per_supplier: "Per supplier",
  per_hour: "Per hour",
};

export const REQUIREMENTS = ["mandatory", "optional"] as const;
export type Requirement = (typeof REQUIREMENTS)[number];

export const INCLUSIONS = ["included", "additional"] as const;
export type Inclusion = (typeof INCLUSIONS)[number];
export const INCLUSION_LABELS: Record<Inclusion, string> = {
  included: "Included in package",
  additional: "Additional",
};

export const VAT_TREATMENTS = ["included", "excluded", "unknown"] as const;
export type VatTreatment = (typeof VAT_TREATMENTS)[number];
export const VAT_LABELS: Record<VatTreatment, string> = {
  included: "VAT included",
  excluded: "VAT excluded",
  unknown: "VAT unknown",
};

export const COST_SOURCES = ["email", "brochure", "quote", "estimate", "assumption"] as const;
export type CostSource = (typeof COST_SOURCES)[number];
export const COST_SOURCE_LABELS: Record<CostSource, string> = {
  email: "Email",
  brochure: "Brochure",
  quote: "Quote",
  estimate: "Estimate",
  assumption: "Assumption",
};

export const SCENARIO_LEVELS = ["minimum", "realistic", "complete"] as const;
export type ScenarioLevel = (typeof SCENARIO_LEVELS)[number];
export type ScenarioOverride = ScenarioLevel | "never";
export const SCENARIO_OVERRIDE_LABELS: Record<ScenarioOverride, string> = {
  minimum: "From scenario A",
  realistic: "From scenario B",
  complete: "Scenario C only",
  never: "Never include",
};

export interface CostItem {
  vendorId: string;
  itemKey: string;
  /** Null = not priced yet. Never read as zero. */
  amount: number | null;
  /** Optional top of a quoted range. */
  amountHigh: number | null;
  currency: string;
  basis: CostBasis;
  /** Hours for per_hour lines; otherwise unused. */
  quantity: number | null;
  requirement: Requirement;
  inclusion: Inclusion;
  vat: VatTreatment;
  source: CostSource | null;
  confidence: Confidence;
  sourceDate: string | null;
  /** Untick to keep a price on file without counting it in totals. */
  inTotal: boolean;
  scenarioOverride: ScenarioOverride | null;
  notes: string | null;
}

export const SERVICE_STATUSES = [
  "included",
  "additional",
  "not_provided",
  "not_permitted",
  "not_applicable",
  "unknown",
] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];
export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  included: "Included in package",
  additional: "Available at additional cost",
  not_provided: "Not provided by venue",
  not_permitted: "Not permitted",
  not_applicable: "Not applicable",
  unknown: "Unknown / not yet confirmed",
};

export interface ServiceEntry {
  vendorId: string;
  serviceKey: string;
  status: ServiceStatus;
  /** Cost line this service is priced on; null = the catalogue default. */
  costItemKey: string | null;
  confidence: Confidence;
  source: CostSource | null;
  sourceDate: string | null;
  notes: string | null;
}

/**
 * Dog policy vocabulary, shared by the database, API, forms and displays.
 * It is used twice per venue: for the wedding itself (`dogPolicy`) and for the
 * accommodation (`dogAccommodation`), since a pet-friendly hotel says nothing
 * about the ceremony. Notes explain; this field decides.
 */
export const DOG_POLICIES = ["welcome", "limited", "not_allowed", "unknown"] as const;
export type DogPolicy = (typeof DOG_POLICIES)[number];
export const DOG_POLICY_LABELS: Record<DogPolicy, string> = {
  welcome: "Welcome",
  limited: "Limited",
  not_allowed: "Not allowed",
  unknown: "Unknown",
};

/** Maps anything stored under the earlier vocabulary onto the current one. */
export function normalizeDogPolicy(value: string | null | undefined): DogPolicy {
  if (value === "allowed_all_day") return "welcome";
  if (value === "ceremony_only") return "limited";
  return (DOG_POLICIES as readonly string[]).includes(value ?? "") ? (value as DogPolicy) : "unknown";
}

/**
 * The one place that turns the two structured dog fields into words, so a
 * pet-friendly hotel is never presented as permission to bring a dog to the
 * wedding, and "Unknown" only appears when nothing is known.
 */
export function describeDogPolicy({
  policy,
  accommodation = "unknown",
}: {
  policy: DogPolicy;
  accommodation?: DogPolicy;
}): string {
  // Normalised so a value stored under the earlier vocabulary can't blank or crash a page.
  policy = normalizeDogPolicy(policy);
  accommodation = normalizeDogPolicy(accommodation);
  const label = DOG_POLICY_LABELS[policy];
  if (accommodation === "unknown") return label;
  const stay = `${DOG_POLICY_LABELS[accommodation]} for accommodation`;
  if (policy === "unknown") return `${stay}; wedding-event access unconfirmed`;
  return `${label} at the wedding; ${stay.charAt(0).toLowerCase()}${stay.slice(1)}`;
}

export const TRI_STATES = ["yes", "no", "unknown"] as const;
export type TriState = (typeof TRI_STATES)[number];

export const ENGLISH_SUPPORT = ["confirmed", "partial", "no", "unknown"] as const;
export type EnglishSupport = (typeof ENGLISH_SUPPORT)[number];
export const ENGLISH_SUPPORT_LABELS: Record<EnglishSupport, string> = {
  confirmed: "English-speaking team confirmed",
  partial: "Partly (some staff)",
  no: "Not offered",
  unknown: "Unknown",
};

export interface FieldMeta {
  confidence: Confidence;
  source: string | null;
  date: string | null;
}

export interface VenueProfile {
  vendorId: string;
  location: string | null;
  ceremonyCapacity: number | null;
  receptionCapacity: number | null;
  partyCapacity: number | null;
  spaceNotes: string | null;
  address: string | null;
  /** Dogs at the wedding itself. */
  dogPolicy: DogPolicy;
  /** Dogs in the venue's accommodation, a separate question. */
  dogAccommodation: DogPolicy;
  dogNotes: string | null;
  directFlightAmsterdam: TriState;
  logisticsNotes: string | null;
  englishSupport: EnglishSupport;
  evaluationNotes: string | null;
  outstandingQuestions: string | null;
  /** Confidence/source/date for key facts that live on venue_details, keyed by field name. */
  fieldMeta: Record<string, FieldMeta>;
}

export interface VenueRating {
  vendorId: string;
  criterionKey: string;
  /** 0–5. Absent rating = not scored; never a default. */
  score: number;
  reasoning: string | null;
}

export type ScenarioId = "A" | "B" | "C";
export const SCENARIO_FOR_LEVEL: Record<ScenarioId, ScenarioLevel> = {
  A: "minimum",
  B: "realistic",
  C: "complete",
};
