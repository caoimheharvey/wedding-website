"use client";

import { useState, useTransition } from "react";
import { saveVenueCosts } from "@/lib/venues/costs/actions";
import { defaultCostItem } from "@/lib/venues/costs/defaults";
import type { CostPatch } from "@/lib/venues/costs/schema";
import { COST_CATALOGUE, COST_GROUPS, type CostItemDef } from "@/lib/venues/analysis/catalogue";
import {
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
  COST_BASES,
  COST_BASIS_LABELS,
  COST_SOURCE_LABELS,
  COST_SOURCES,
  INCLUSION_LABELS,
  INCLUSIONS,
  REQUIREMENTS,
  SCENARIO_LEVELS,
  SCENARIO_OVERRIDE_LABELS,
  VAT_LABELS,
  VAT_TREATMENTS,
  type Confidence,
  type CostBasis,
  type CostItem,
  type CostSource,
  type Inclusion,
  type Requirement,
  type ScenarioOverride,
  type VatTreatment,
} from "@/lib/venues/analysis/types";
import { HistoryFields, SaveBar, SUGGESTED_CONFIDENCE, type HistoryDraft } from "./venue-editor-parts";

interface RowState {
  amount: string;
  amountHigh: string;
  quantity: string;
  basis: CostBasis;
  requirement: Requirement;
  inclusion: Inclusion;
  vat: VatTreatment;
  source: CostSource | "";
  confidence: Confidence;
  sourceDate: string;
  inTotal: boolean;
  scenarioOverride: ScenarioOverride | "";
  notes: string;
}

const str = (value: number | string | null) => (value === null ? "" : String(value));
const toNumber = (value: string) => (value.trim() === "" ? null : Number(value));

function toRow(item: CostItem): RowState {
  return {
    amount: str(item.amount),
    amountHigh: str(item.amountHigh),
    quantity: str(item.quantity),
    basis: item.basis,
    requirement: item.requirement,
    inclusion: item.inclusion,
    vat: item.vat,
    source: item.source ?? "",
    confidence: item.confidence,
    sourceDate: item.sourceDate ?? "",
    inTotal: item.inTotal,
    scenarioOverride: item.scenarioOverride ?? "",
    notes: item.notes ?? "",
  };
}

function toPatch(key: string, row: RowState): CostPatch {
  return {
    itemKey: key,
    amount: toNumber(row.amount),
    amountHigh: toNumber(row.amountHigh),
    quantity: toNumber(row.quantity),
    basis: row.basis,
    requirement: row.requirement,
    inclusion: row.inclusion,
    vat: row.vat,
    source: row.source === "" ? null : row.source,
    confidence: row.confidence,
    sourceDate: row.sourceDate === "" ? null : row.sourceDate,
    inTotal: row.inTotal,
    scenarioOverride: row.scenarioOverride === "" ? null : row.scenarioOverride,
    notes: row.notes.trim() === "" ? null : row.notes,
  };
}

const small = "input !px-2 !py-1 text-xs";

export function CostBreakdownEditor({
  vendorId,
  category,
  items,
  today,
}: {
  vendorId: string;
  category: string;
  items: CostItem[];
  today: string;
}) {
  const saved = new Map(items.map((item) => [item.itemKey, item]));
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(COST_CATALOGUE.map((def) => [def.key, toRow(saved.get(def.key) ?? defaultCostItem(vendorId, def.key))])),
  );
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryDraft>({ kind: "note", date: today, text: "" });
  const [result, setResult] = useState<{ message?: string; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const update = (key: string, patch: Partial<RowState>) => {
    setRows((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
    setDirty((current) => new Set(current).add(key));
  };

  const save = () =>
    startTransition(async () => {
      const patches = [...dirty].map((key) => toPatch(key, rows[key]));
      const response = await saveVenueCosts(vendorId, category, patches, {
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
        One line per cost. A blank amount means <strong>not priced yet</strong> (never counted as free).
        &ldquo;Included in package&rdquo; means no extra charge. Mandatory lines always count; optional
        lines count from the scenario shown. VAT is never assumed.
      </p>

      {COST_GROUPS.map((group) => {
        const defs = COST_CATALOGUE.filter((def) => def.group === group.id);
        const pricedCount = defs.filter((def) => rows[def.key].amount !== "").length;
        return (
          <details
            key={group.id}
            id={group.id === "food_drinks" ? "s4" : group.id === "other" ? "s8" : group.id === "planning_operations" ? "s10" : undefined}
            open={pricedCount > 0 || group.id === "venue_ceremony"}
            className="rounded-lg border border-border p-3"
          >
            <summary className="cursor-pointer text-sm font-medium text-ink">
              {group.label}{" "}
              <span className="font-normal text-foreground/50">
                ({pricedCount} of {defs.length} priced)
              </span>
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              {defs.map((def) => (
                <CostRow key={def.key} def={def} row={rows[def.key]} onChange={(patch) => update(def.key, patch)} />
              ))}
            </div>
          </details>
        );
      })}

      <HistoryFields value={history} onChange={setHistory} />
      <SaveBar pending={pending} dirtyCount={dirty.size} onSave={save} message={result.message} error={result.error} label="Save costs" />
    </div>
  );
}

function CostRow({ def, row, onChange }: { def: CostItemDef; row: RowState; onChange: (patch: Partial<RowState>) => void }) {
  const priced = row.amount !== "";
  return (
    <div className={`rounded-md border p-2 ${priced ? "border-border" : "border-border/50 bg-foreground/[0.02]"}`}>
      <div className="grid items-end gap-2 sm:grid-cols-[minmax(10rem,1.3fr)_7rem_repeat(4,minmax(7rem,1fr))]">
        <div className="text-sm text-ink">
          {def.label}
          {!priced && <span className="ml-2 rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] text-foreground/60">unpriced</span>}
        </div>
        <input
          aria-label={`${def.label} amount`}
          type="number"
          min="0"
          step="any"
          value={row.amount}
          onChange={(event) => onChange({ amount: event.target.value })}
          placeholder="Amount €"
          className={small}
        />
        <select aria-label={`${def.label} basis`} value={row.basis} onChange={(event) => onChange({ basis: event.target.value as CostBasis })} className={small}>
          {COST_BASES.map((basis) => (
            <option key={basis} value={basis}>
              {COST_BASIS_LABELS[basis]}
            </option>
          ))}
        </select>
        <select aria-label={`${def.label} requirement`} value={row.requirement} onChange={(event) => onChange({ requirement: event.target.value as Requirement })} className={small}>
          {REQUIREMENTS.map((value) => (
            <option key={value} value={value}>
              {value === "mandatory" ? "Mandatory" : "Optional"}
            </option>
          ))}
        </select>
        <select aria-label={`${def.label} inclusion`} value={row.inclusion} onChange={(event) => onChange({ inclusion: event.target.value as Inclusion })} className={small}>
          {INCLUSIONS.map((value) => (
            <option key={value} value={value}>
              {INCLUSION_LABELS[value]}
            </option>
          ))}
        </select>
        <select aria-label={`${def.label} VAT`} value={row.vat} onChange={(event) => onChange({ vat: event.target.value as VatTreatment })} className={small}>
          {VAT_TREATMENTS.map((value) => (
            <option key={value} value={value}>
              {VAT_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 grid items-end gap-2 sm:grid-cols-[repeat(5,minmax(7rem,1fr))_auto]">
        <select
          aria-label={`${def.label} price source`}
          value={row.source}
          onChange={(event) => {
            const source = event.target.value as CostSource | "";
            onChange({
              source,
              ...(source && row.confidence === "unknown" ? { confidence: SUGGESTED_CONFIDENCE[source] } : {}),
            });
          }}
          className={small}
        >
          <option value="">Source…</option>
          {COST_SOURCES.map((value) => (
            <option key={value} value={value}>
              {COST_SOURCE_LABELS[value]}
            </option>
          ))}
        </select>
        <select aria-label={`${def.label} confidence`} value={row.confidence} onChange={(event) => onChange({ confidence: event.target.value as Confidence })} className={small}>
          {CONFIDENCE_LEVELS.map((value) => (
            <option key={value} value={value}>
              {CONFIDENCE_LABELS[value]}
            </option>
          ))}
        </select>
        <input aria-label={`${def.label} source date`} type="date" value={row.sourceDate} onChange={(event) => onChange({ sourceDate: event.target.value })} className={small} />
        <select
          aria-label={`${def.label} scenario`}
          value={row.scenarioOverride}
          onChange={(event) => onChange({ scenarioOverride: event.target.value as ScenarioOverride | "" })}
          className={small}
        >
          <option value="">
            Default ({def.level === "never" ? "never" : def.level === "minimum" ? "A" : def.level === "realistic" ? "B" : "C"})
          </option>
          {[...SCENARIO_LEVELS, "never" as const].map((value) => (
            <option key={value} value={value}>
              {SCENARIO_OVERRIDE_LABELS[value]}
            </option>
          ))}
        </select>
        <input
          aria-label={`${def.label} top of range`}
          type="number"
          min="0"
          step="any"
          value={row.amountHigh}
          onChange={(event) => onChange({ amountHigh: event.target.value })}
          placeholder="Top of range €"
          className={small}
        />
        <label className="flex items-center gap-1 text-xs text-ink">
          <input type="checkbox" checked={row.inTotal} onChange={(event) => onChange({ inTotal: event.target.checked })} className="h-3.5 w-3.5" />
          In total
        </label>
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_8rem]">
        <input
          aria-label={`${def.label} notes`}
          value={row.notes}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Notes (e.g. what it covers, conditions)"
          className={small}
        />
        {row.basis === "per_hour" && (
          <input
            aria-label={`${def.label} hours`}
            type="number"
            min="0"
            step="any"
            value={row.quantity}
            onChange={(event) => onChange({ quantity: event.target.value })}
            placeholder="Hours"
            className={small}
          />
        )}
      </div>
    </div>
  );
}
