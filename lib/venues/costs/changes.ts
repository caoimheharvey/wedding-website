import { formatCurrency } from "@/lib/budget/format";
import { COST_ITEM_BY_KEY, SERVICE_BY_KEY } from "@/lib/venues/analysis/catalogue";
import {
  CONFIDENCE_LABELS,
  COST_BASIS_LABELS,
  SERVICE_STATUS_LABELS,
  VAT_LABELS,
  type CostItem,
  type ServiceEntry,
} from "@/lib/venues/analysis/types";
import type { VenueFieldChange } from "@/lib/venues/types";

/** A cost line as readable text, so the history shows what a revised quote changed. */
export function describeCost(item: CostItem | undefined): string | null {
  if (!item || (item.amount === null && item.notes === null)) return null;
  const parts: string[] = [];
  if (item.amount !== null) {
    const range =
      item.amountHigh !== null && item.amountHigh !== item.amount
        ? `${formatCurrency(item.amount)}–${formatCurrency(item.amountHigh)}`
        : formatCurrency(item.amount);
    parts.push(`${range}${item.basis === "fixed" ? "" : ` ${COST_BASIS_LABELS[item.basis].toLowerCase()}`}`);
  } else {
    parts.push("unpriced");
  }
  parts.push(item.requirement, item.inclusion === "included" ? "included in package" : "additional");
  parts.push(VAT_LABELS[item.vat].toLowerCase(), CONFIDENCE_LABELS[item.confidence].toLowerCase());
  if (!item.inTotal) parts.push("not counted in totals");
  return parts.join(", ");
}

export function diffCostItems(before: CostItem[], after: CostItem[]): VenueFieldChange[] {
  const previous = new Map(before.map((item) => [item.itemKey, item]));
  const changes: VenueFieldChange[] = [];
  for (const item of after) {
    const from = describeCost(previous.get(item.itemKey));
    const to = describeCost(item);
    if (from === to) continue;
    changes.push({
      field: `cost:${item.itemKey}`,
      label: `Cost: ${COST_ITEM_BY_KEY.get(item.itemKey)?.label ?? item.itemKey}`,
      from,
      to,
    });
  }
  return changes;
}

const describeService = (entry: ServiceEntry | undefined) =>
  entry && entry.status !== "unknown" ? SERVICE_STATUS_LABELS[entry.status] : null;

export function diffServices(before: ServiceEntry[], after: ServiceEntry[]): VenueFieldChange[] {
  const previous = new Map(before.map((entry) => [entry.serviceKey, entry]));
  const changes: VenueFieldChange[] = [];
  for (const entry of after) {
    const from = describeService(previous.get(entry.serviceKey));
    const to = describeService(entry);
    if (from === to) continue;
    changes.push({
      field: `service:${entry.serviceKey}`,
      label: `Service: ${SERVICE_BY_KEY.get(entry.serviceKey)?.label ?? entry.serviceKey}`,
      from,
      to,
    });
  }
  return changes;
}
