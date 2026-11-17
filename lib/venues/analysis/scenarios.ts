import type { VenueDetails } from "../types";
import { ASSUMPTIONS } from "./assumptions";
import { BUCKET_LABELS, COST_CATALOGUE, type Bucket } from "./catalogue";
import {
  isVenueStated,
  SCENARIO_FOR_LEVEL,
  type Confidence,
  type CostItem,
  type ScenarioId,
  type ScenarioLevel,
  type ServiceEntry,
  type VatTreatment,
  type VenueProfile,
} from "./types";

export interface Range {
  low: number;
  mid: number;
  high: number;
}

export type LineStatus = "priced" | "covered" | "unpriced" | "external" | "unconfirmed";

export interface ScenarioLine {
  key: string;
  label: string;
  bucket: Bucket;
  status: LineStatus;
  optional: boolean;
  quantity: number | null;
  /** Without VAT. Zero unless priced. */
  net: Range;
  vat: Range;
  vatTreatment: VatTreatment | null;
  /** Venue-stated figure or our own estimate. Null when there is no figure. */
  certainty: "confirmed" | "estimated" | null;
  confidence: Confidence | null;
  note: string | null;
}

export interface ScenarioResult {
  scenario: ScenarioId;
  label: string;
  adults: number;
  lines: ScenarioLine[];
  /** Minimum-guest and minimum-spend top-ups, also included in `buckets.food`. */
  adjustments: ScenarioLine[];
  buckets: Record<Bucket, Range>;
  vat: Range;
  total: Range;
  perAdult: Range;
  confirmedTotal: number;
  estimatedTotal: number;
  optionalSelected: number;
  /** Lines we need but have no price for (not priced, sourced externally, or unconfirmed). */
  unpriced: ScenarioLine[];
  coveredCount: number;
  pricedCount: number;
  neededCount: number;
  /** Share of the intended wedding that has a price or is covered by the package. */
  completeness: number;
}

export interface ScenarioInput {
  details: VenueDetails | null;
  costItems: CostItem[];
  services: ServiceEntry[];
  profile: VenueProfile | null;
  adults: number;
}

const SCENARIO_LABELS: Record<ScenarioId, string> = {
  A: "A: Venue / package minimum",
  B: "B: Realistic wedding",
  C: "C: More complete package",
};

const LEVEL_RANK: Record<ScenarioLevel, number> = { minimum: 0, realistic: 1, complete: 2 };

const zero = (): Range => ({ low: 0, mid: 0, high: 0 });
const add = (a: Range, b: Range): Range => ({ low: a.low + b.low, mid: a.mid + b.mid, high: a.high + b.high });
const scale = (a: Range, factor: number): Range => ({ low: a.low * factor, mid: a.mid * factor, high: a.high * factor });

function quantityFor(row: CostItem, adults: number): number {
  switch (row.basis) {
    case "per_adult":
      return adults;
    case "per_child":
      return ASSUMPTIONS.children;
    case "per_supplier":
      return ASSUMPTIONS.suppliers;
    case "per_hour":
      return row.quantity ?? ASSUMPTIONS.defaultHours;
    default:
      return 1;
  }
}

/** Net and VAT for a priced row at a given quantity. Unknown VAT widens the range, never narrows it. */
function priceRow(row: CostItem, quantity: number, vatRate: number): { net: Range; vat: Range } {
  const amount = row.amount ?? 0;
  const lowNet = amount * quantity;
  const highNet = (row.amountHigh ?? amount) * quantity;
  const net: Range = { low: lowNet, high: highNet, mid: (lowNet + highNet) / 2 };

  if (row.vat === "excluded") return { net, vat: scale(net, vatRate) };
  if (row.vat === "included") return { net, vat: zero() };
  // Unknown: as stated at the low end, plus VAT at the high end; mid is halfway.
  const highVat = highNet * vatRate;
  return { net, vat: { low: 0, mid: highVat / 2, high: highVat } };
}

const emptyLine = (
  key: string,
  label: string,
  bucket: Bucket,
  status: LineStatus,
  note: string | null,
  optional = false,
): ScenarioLine => ({
  key,
  label,
  bucket,
  status,
  optional,
  quantity: null,
  net: zero(),
  vat: zero(),
  vatTreatment: null,
  certainty: null,
  confidence: null,
  note,
});

export function computeScenario(input: ScenarioInput, scenario: ScenarioId): ScenarioResult {
  const { details, costItems, services, profile, adults } = input;
  const vatRate = (details?.vatPercent ?? 21) / 100;
  const level = SCENARIO_FOR_LEVEL[scenario];
  const rows = new Map(costItems.map((row) => [row.itemKey, row]));
  const serviceStatus = new Map(services.map((entry) => [entry.serviceKey, entry.status]));

  const lines: ScenarioLine[] = [];

  for (const def of COST_CATALOGUE) {
    const row = rows.get(def.key);
    if (row && !row.inTotal) continue;

    // Lines with no service to check and no price entered (e.g. an exclusivity fee) are
    // unknowns for the questions list, not "required" lines that would drag completeness down.
    if (!row && !def.core && !def.serviceKey) continue;

    const itemLevel = row?.scenarioOverride ?? def.level;
    const wanted =
      def.core ||
      row?.requirement === "mandatory" ||
      (itemLevel !== "never" && LEVEL_RANK[itemLevel] <= LEVEL_RANK[level]);
    if (!wanted) continue;

    const status = def.serviceKey ? (serviceStatus.get(def.serviceKey) ?? "unknown") : null;
    if (status === "not_applicable") continue;

    const optional = row?.requirement === "optional";

    // An "included" service zeroes optional extras, but a mandatory priced line is
    // the package price itself (e.g. a per-person menu), so it still counts.
    const coveredByService = status === "included" && (!row || row.requirement === "optional");
    if (row?.inclusion === "included" || coveredByService) {
      lines.push(emptyLine(def.key, def.label, def.bucket, "covered", "Included in the package: no extra cost", optional));
      continue;
    }

    if (!row || row.amount === null) {
      let lineStatus: LineStatus;
      if (status === "not_provided" || status === "not_permitted") lineStatus = "external";
      else if (!row && status === "unknown") lineStatus = "unconfirmed";
      else lineStatus = "unpriced";
      const note =
        lineStatus === "external"
          ? "Not provided by the venue: source separately (no price yet)"
          : lineStatus === "unconfirmed"
            ? "Not confirmed whether the venue offers this"
            : "Needed, but no price yet";
      lines.push(emptyLine(def.key, def.label, def.bucket, lineStatus, note, optional));
      continue;
    }

    const quantity = quantityFor(row, adults);
    const { net, vat } = priceRow(row, quantity, vatRate);
    lines.push({
      key: def.key,
      label: def.label,
      bucket: def.bucket,
      status: "priced",
      optional,
      quantity,
      net,
      vat,
      vatTreatment: row.vat,
      certainty: isVenueStated(row.confidence) && row.vat !== "unknown" ? "confirmed" : "estimated",
      confidence: row.confidence,
      note:
        status === "not_provided" || status === "not_permitted"
          ? "Sourced separately: our own estimate"
          : null,
    });
  }

  const adjustments: ScenarioLine[] = [];
  const priced = lines.filter((line) => line.status === "priced");

  // Venues with a minimum guest count bill at least that many, whatever we plan for.
  const minGuests = details?.minGuests ?? null;
  if (minGuests !== null && minGuests > adults) {
    const extra = minGuests - adults;
    let net = zero();
    let vat = zero();
    for (const line of priced) {
      const row = rows.get(line.key);
      if (!row || row.basis !== "per_adult" || line.bucket !== "food") continue;
      const extraCost = priceRow(row, extra, vatRate);
      net = add(net, extraCost.net);
      vat = add(vat, extraCost.vat);
    }
    if (net.high > 0) {
      adjustments.push({
        ...emptyLine("min_guests", `Minimum guest count (billed for ${minGuests})`, "food", "priced", `${extra} guests above our ${adults}`),
        net,
        vat,
        certainty: "estimated",
        confidence: "calculated",
      });
    }
  }

  // A minimum spend tops food & drinks up to the stated floor.
  const minSpend = details?.minSpend ?? null;
  if (minSpend !== null) {
    const foodSoFar = [...priced, ...adjustments]
      .filter((line) => line.bucket === "food")
      .reduce((sum, line) => sum + line.net.mid + line.vat.mid, 0);
    const shortfall = minSpend - foodSoFar;
    if (shortfall > 0) {
      const stated = profile?.fieldMeta.minSpend?.confidence;
      adjustments.push({
        ...emptyLine(
          "min_spend",
          "Minimum spend top-up",
          "food",
          "priced",
          `Venue minimum ${Math.round(minSpend)}; VAT treatment of the minimum not stated`,
        ),
        net: { low: shortfall, mid: shortfall, high: shortfall },
        certainty: stated && isVenueStated(stated) ? "confirmed" : "estimated",
        confidence: stated ?? "unknown",
      });
    }
  }

  const everyPriced = [...priced, ...adjustments];
  const buckets = Object.fromEntries(
    (Object.keys(BUCKET_LABELS) as Bucket[]).map((bucket) => [
      bucket,
      everyPriced.filter((line) => line.bucket === bucket).reduce((sum, line) => add(sum, line.net), zero()),
    ]),
  ) as Record<Bucket, Range>;
  const vat = everyPriced.reduce((sum, line) => add(sum, line.vat), zero());
  const net = Object.values(buckets).reduce((sum, range) => add(sum, range), zero());
  const total = add(net, vat);

  const lineTotal = (line: ScenarioLine) => line.net.mid + line.vat.mid;
  const confirmedTotal = everyPriced.filter((l) => l.certainty === "confirmed").reduce((s, l) => s + lineTotal(l), 0);
  const estimatedTotal = everyPriced.filter((l) => l.certainty === "estimated").reduce((s, l) => s + lineTotal(l), 0);
  const optionalSelected = priced.filter((l) => l.optional).reduce((s, l) => s + lineTotal(l), 0);

  const covered = lines.filter((l) => l.status === "covered").length;
  const needed = lines.length;
  const unpriced = lines.filter((l) => l.status === "unpriced" || l.status === "external" || l.status === "unconfirmed");

  return {
    scenario,
    label: SCENARIO_LABELS[scenario],
    adults,
    lines,
    adjustments,
    buckets,
    vat,
    total,
    perAdult: adults > 0 ? scale(total, 1 / adults) : zero(),
    confirmedTotal,
    estimatedTotal,
    optionalSelected,
    unpriced,
    coveredCount: covered,
    pricedCount: priced.length,
    neededCount: needed,
    completeness: needed === 0 ? 0 : (priced.length + covered) / needed,
  };
}
