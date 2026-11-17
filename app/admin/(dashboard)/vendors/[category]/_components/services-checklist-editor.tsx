"use client";

import { useState, useTransition } from "react";
import { formatCurrency } from "@/lib/budget/format";
import { saveVenueServices } from "@/lib/venues/costs/actions";
import { defaultService } from "@/lib/venues/costs/defaults";
import type { ServicePatch } from "@/lib/venues/costs/schema";
import {
  COST_ITEM_BY_KEY,
  COST_CATALOGUE,
  SERVICE_CATALOGUE,
  SERVICE_GROUPS,
} from "@/lib/venues/analysis/catalogue";
import {
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
  SERVICE_STATUS_LABELS,
  SERVICE_STATUSES,
  type Confidence,
  type CostItem,
  type ServiceEntry,
  type ServiceStatus,
} from "@/lib/venues/analysis/types";
import { HistoryFields, SaveBar, type HistoryDraft } from "./venue-editor-parts";

interface State {
  status: ServiceStatus;
  confidence: Confidence;
  costItemKey: string;
  notes: string;
}

const small = "input !px-2 !py-1 text-xs";

const STATUS_STYLE: Record<ServiceStatus, string> = {
  included: "text-olive",
  additional: "text-aegean",
  not_provided: "text-terracotta",
  not_permitted: "text-terracotta",
  not_applicable: "text-foreground/50",
  unknown: "text-foreground/50",
};

export function ServicesChecklistEditor({
  vendorId,
  category,
  services,
  costItems,
  today,
}: {
  vendorId: string;
  category: string;
  services: ServiceEntry[];
  costItems: CostItem[];
  today: string;
}) {
  const saved = new Map(services.map((entry) => [entry.serviceKey, entry]));
  const [rows, setRows] = useState<Record<string, State>>(() =>
    Object.fromEntries(
      SERVICE_CATALOGUE.map((def) => {
        const entry = saved.get(def.key) ?? defaultService(vendorId, def.key);
        return [def.key, { status: entry.status, confidence: entry.confidence, costItemKey: entry.costItemKey ?? "", notes: entry.notes ?? "" }];
      }),
    ),
  );
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryDraft>({ kind: "note", date: today, text: "" });
  const [result, setResult] = useState<{ message?: string; error?: string }>({});
  const [pending, startTransition] = useTransition();
  const priced = new Map(costItems.filter((item) => item.amount !== null).map((item) => [item.itemKey, item]));

  const update = (key: string, patch: Partial<State>) => {
    setRows((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
    setDirty((current) => new Set(current).add(key));
  };

  const save = () =>
    startTransition(async () => {
      const patches: ServicePatch[] = [...dirty].map((key) => ({
        serviceKey: key,
        status: rows[key].status,
        confidence: rows[key].confidence,
        costItemKey: rows[key].costItemKey === "" ? null : rows[key].costItemKey,
        notes: rows[key].notes.trim() === "" ? null : rows[key].notes,
      }));
      const response = await saveVenueServices(vendorId, category, patches, {
        kind: history.kind,
        date: history.date,
        text: history.text || null,
      });
      setResult(response);
      if (!response.error) {
        setDirty(new Set());
        setHistory((current) => ({ ...current, text: "" }));
      }
    });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-foreground/60">
        Set each service to exactly what the venue said. Leave it as <strong>Unknown</strong> until
        confirmed: unknown is never treated as included or as excluded.
      </p>
      {SERVICE_GROUPS.map((group) => (
        <fieldset key={group.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-medium tracking-wide text-foreground/50 uppercase">{group.label}</legend>
          {SERVICE_CATALOGUE.filter((def) => def.group === group.id).map((def) => {
            const row = rows[def.key];
            const costKey = row.costItemKey || def.defaultCostKey;
            const linked = costKey ? priced.get(costKey) : undefined;
            return (
              <div key={def.key} className="grid items-center gap-2 sm:grid-cols-[minmax(10rem,1fr)_minmax(12rem,1.2fr)_minmax(9rem,1fr)_1.5fr]">
                <div className="text-sm text-ink">{def.label}</div>
                <select
                  aria-label={`${def.label} status`}
                  value={row.status}
                  onChange={(event) => update(def.key, { status: event.target.value as ServiceStatus })}
                  className={`${small} ${STATUS_STYLE[row.status]}`}
                >
                  {SERVICE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {SERVICE_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={`${def.label} confidence`}
                  value={row.confidence}
                  onChange={(event) => update(def.key, { confidence: event.target.value as Confidence })}
                  className={small}
                >
                  {CONFIDENCE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {CONFIDENCE_LABELS[level]}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={`${def.label} notes`}
                  value={row.notes}
                  onChange={(event) => update(def.key, { notes: event.target.value })}
                  placeholder="Notes"
                  className={small}
                />
                {row.status === "additional" && (
                  <div className="text-xs sm:col-span-4">
                    {linked ? (
                      <span className="text-olive">
                        Priced under &ldquo;{COST_ITEM_BY_KEY.get(linked.itemKey)?.label}&rdquo;: {formatCurrency(linked.amount ?? 0)}
                      </span>
                    ) : (
                      <span className="text-terracotta">
                        No price entered for &ldquo;{costKey ? COST_ITEM_BY_KEY.get(costKey)?.label : "this service"}&rdquo; yet:
                        it counts as unpriced. Add it in the cost breakdown.
                      </span>
                    )}{" "}
                    <label className="ml-2 text-foreground/50">
                      priced on{" "}
                      <select
                        value={row.costItemKey}
                        onChange={(event) => update(def.key, { costItemKey: event.target.value })}
                        className="input !inline-block !w-auto !px-1 !py-0.5 text-xs"
                      >
                        <option value="">default</option>
                        {COST_CATALOGUE.map((item) => (
                          <option key={item.key} value={item.key}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </fieldset>
      ))}
      <HistoryFields value={history} onChange={setHistory} />
      <SaveBar pending={pending} dirtyCount={dirty.size} onSave={save} message={result.message} error={result.error} label="Save services" />
    </div>
  );
}
