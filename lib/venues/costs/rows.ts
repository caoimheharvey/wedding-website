import type {
  Confidence,
  CostBasis,
  CostItem,
  CostSource,
  EnglishSupport,
  DogPolicy,
  FieldMeta,
  Inclusion,
  Requirement,
  ScenarioOverride,
  ServiceEntry,
  ServiceStatus,
  TriState,
  VatTreatment,
  VenueProfile,
  VenueRating,
} from "@/lib/venues/analysis/types";

// Postgres numeric columns can arrive as strings; Number() keeps nulls null.
const num = (value: number | string | null) => (value === null ? null : Number(value));

export interface CostItemRow {
  vendor_id: string;
  item_key: string;
  amount: number | string | null;
  amount_high: number | string | null;
  currency: string;
  basis: CostBasis;
  quantity: number | string | null;
  requirement: Requirement;
  inclusion: Inclusion;
  vat: VatTreatment;
  source: CostSource | null;
  confidence: Confidence;
  source_date: string | null;
  in_total: boolean;
  scenario_override: ScenarioOverride | null;
  notes: string | null;
}

export const mapCostRow = (row: CostItemRow): CostItem => ({
  vendorId: row.vendor_id,
  itemKey: row.item_key,
  amount: num(row.amount),
  amountHigh: num(row.amount_high),
  currency: row.currency,
  basis: row.basis,
  quantity: num(row.quantity),
  requirement: row.requirement,
  inclusion: row.inclusion,
  vat: row.vat,
  source: row.source,
  confidence: row.confidence,
  sourceDate: row.source_date,
  inTotal: row.in_total,
  scenarioOverride: row.scenario_override,
  notes: row.notes,
});

export const costToRow = (item: CostItem) => ({
  vendor_id: item.vendorId,
  item_key: item.itemKey,
  amount: item.amount,
  amount_high: item.amountHigh,
  currency: item.currency,
  basis: item.basis,
  quantity: item.quantity,
  requirement: item.requirement,
  inclusion: item.inclusion,
  vat: item.vat,
  source: item.source,
  confidence: item.confidence,
  source_date: item.sourceDate,
  in_total: item.inTotal,
  scenario_override: item.scenarioOverride,
  notes: item.notes,
  updated_at: new Date().toISOString(),
});

export interface ServiceRow {
  vendor_id: string;
  service_key: string;
  status: ServiceStatus;
  cost_item_key: string | null;
  confidence: Confidence;
  source: CostSource | null;
  source_date: string | null;
  notes: string | null;
}

export const mapServiceRow = (row: ServiceRow): ServiceEntry => ({
  vendorId: row.vendor_id,
  serviceKey: row.service_key,
  status: row.status,
  costItemKey: row.cost_item_key,
  confidence: row.confidence,
  source: row.source,
  sourceDate: row.source_date,
  notes: row.notes,
});

export const serviceToRow = (entry: ServiceEntry) => ({
  vendor_id: entry.vendorId,
  service_key: entry.serviceKey,
  status: entry.status,
  cost_item_key: entry.costItemKey,
  confidence: entry.confidence,
  source: entry.source,
  source_date: entry.sourceDate,
  notes: entry.notes,
  updated_at: new Date().toISOString(),
});

export interface ProfileRow {
  vendor_id: string;
  location: string | null;
  ceremony_capacity: number | null;
  reception_capacity: number | null;
  party_capacity: number | null;
  space_notes: string | null;
  dog_policy: DogPolicy;
  dog_notes: string | null;
  direct_flight_amsterdam: TriState;
  logistics_notes: string | null;
  english_support: EnglishSupport;
  evaluation_notes: string | null;
  outstanding_questions: string | null;
  field_meta: Record<string, FieldMeta> | null;
}

export const mapProfileRow = (row: ProfileRow): VenueProfile => ({
  vendorId: row.vendor_id,
  location: row.location,
  ceremonyCapacity: row.ceremony_capacity,
  receptionCapacity: row.reception_capacity,
  partyCapacity: row.party_capacity,
  spaceNotes: row.space_notes,
  dogPolicy: row.dog_policy,
  dogNotes: row.dog_notes,
  directFlightAmsterdam: row.direct_flight_amsterdam,
  logisticsNotes: row.logistics_notes,
  englishSupport: row.english_support,
  evaluationNotes: row.evaluation_notes,
  outstandingQuestions: row.outstanding_questions,
  fieldMeta: row.field_meta ?? {},
});

export const profileToRow = (profile: VenueProfile) => ({
  vendor_id: profile.vendorId,
  location: profile.location,
  ceremony_capacity: profile.ceremonyCapacity,
  reception_capacity: profile.receptionCapacity,
  party_capacity: profile.partyCapacity,
  space_notes: profile.spaceNotes,
  dog_policy: profile.dogPolicy,
  dog_notes: profile.dogNotes,
  direct_flight_amsterdam: profile.directFlightAmsterdam,
  logistics_notes: profile.logisticsNotes,
  english_support: profile.englishSupport,
  evaluation_notes: profile.evaluationNotes,
  outstanding_questions: profile.outstandingQuestions,
  field_meta: profile.fieldMeta,
  updated_at: new Date().toISOString(),
});

export interface RatingRow {
  vendor_id: string;
  criterion_key: string;
  score: number | string;
  reasoning: string | null;
}

export const mapRatingRow = (row: RatingRow): VenueRating => ({
  vendorId: row.vendor_id,
  criterionKey: row.criterion_key,
  score: Number(row.score),
  reasoning: row.reasoning,
});
