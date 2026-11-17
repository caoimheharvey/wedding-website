import { formatCurrency } from "@/lib/budget/format";
import type { VenueAnalysis } from "@/lib/venues/analysis/analyse";
import { BUCKET_LABELS, type Bucket } from "@/lib/venues/analysis/catalogue";
import type { Range, ScenarioLine, ScenarioResult } from "@/lib/venues/analysis/scenarios";
import { VAT_LABELS } from "@/lib/venues/analysis/types";

const pct = (value: number) => `${Math.round(value * 100)}%`;

function RangeCell({ range }: { range: Range }) {
  const spread = range.high - range.low > 1;
  return (
    <>
      <td className="py-1 pr-3 text-right text-foreground/60">{spread ? formatCurrency(range.low) : ""}</td>
      <td className="py-1 pr-3 text-right text-ink">{formatCurrency(range.mid)}</td>
      <td className="py-1 text-right text-foreground/60">{spread ? formatCurrency(range.high) : ""}</td>
    </>
  );
}

const LINE_TAG: Record<ScenarioLine["status"], string> = {
  priced: "",
  covered: "included in package",
  unpriced: "unpriced",
  external: "source separately (unpriced)",
  unconfirmed: "not confirmed",
};

function ScenarioCard({ scenario }: { scenario: ScenarioResult }) {
  const buckets = (Object.keys(BUCKET_LABELS) as Bucket[]).filter((bucket) => scenario.buckets[bucket].high > 0);
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-lg text-ink">{scenario.label}</h3>
        <span className="text-sm text-foreground/60">{pct(scenario.completeness)} of this scenario priced or covered</span>
      </div>
      <table className="mt-2 w-full text-sm">
        <thead className="text-xs text-foreground/50">
          <tr>
            <th className="text-left font-normal" />
            <th className="pr-3 text-right font-normal">Low</th>
            <th className="pr-3 text-right font-normal">Estimate</th>
            <th className="text-right font-normal">High</th>
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket) => (
            <tr key={bucket} className="border-t border-border/60">
              <td className="py-1 pr-3 text-ink">{BUCKET_LABELS[bucket]}</td>
              <RangeCell range={scenario.buckets[bucket]} />
            </tr>
          ))}
          <tr className="border-t border-border/60">
            <td className="py-1 pr-3 text-ink">VAT</td>
            <RangeCell range={scenario.vat} />
          </tr>
          <tr className="border-t border-border font-medium">
            <td className="py-1 pr-3 text-ink">Total estimated cost</td>
            <RangeCell range={scenario.total} />
          </tr>
          <tr>
            <td className="py-1 pr-3 text-foreground/60">Cost per adult guest ({scenario.adults})</td>
            <RangeCell range={scenario.perAdult} />
          </tr>
          <tr>
            <td className="py-1 pr-3 text-foreground/60">of which optional extras</td>
            <td />
            <td className="py-1 pr-3 text-right text-foreground/60">{formatCurrency(scenario.optionalSelected)}</td>
            <td />
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-xs text-foreground/60">
        Confirmed by the venue: {formatCurrency(scenario.confirmedTotal)} · our estimates: {formatCurrency(scenario.estimatedTotal)} ·
        unpriced: {scenario.unpriced.length} {scenario.unpriced.length === 1 ? "item" : "items"} (not in the total)
      </p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-aegean">Line by line</summary>
        <ul className="mt-1 flex flex-col gap-1 text-xs">
          {[...scenario.lines, ...scenario.adjustments].map((line) => (
            <li key={line.key} className="flex flex-wrap justify-between gap-2 border-t border-border/60 pt-1">
              <span className="text-ink">
                {line.label}
                {line.status === "priced" && line.quantity !== null && line.quantity !== 1 && (
                  <span className="text-foreground/50"> × {line.quantity}</span>
                )}
                {line.optional && <span className="text-foreground/50"> (optional)</span>}
              </span>
              <span className={line.status === "priced" ? "text-ink" : "text-terracotta"}>
                {line.status === "priced" ? (
                  <>
                    {formatCurrency(line.net.mid + line.vat.mid)}{" "}
                    <span className="text-foreground/50">
                      {line.vatTreatment ? VAT_LABELS[line.vatTreatment].toLowerCase() : ""} · {line.certainty}
                    </span>
                  </>
                ) : (
                  LINE_TAG[line.status]
                )}
              </span>
              {line.note && <span className="w-full text-foreground/50">{line.note}</span>}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function VenueScenarios({ analysis }: { analysis: VenueAnalysis }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-foreground/60">
        Same assumptions for every venue ({analysis.adults} adult guests). Services already included in
        the package are not added again; unpriced items are listed, never counted as free. These are
        our calculations from the figures above, not venue quotes.
      </p>
      <div className="grid gap-4 xl:grid-cols-3">
        <ScenarioCard scenario={analysis.scenarios.A} />
        <ScenarioCard scenario={analysis.scenarios.B} />
        <ScenarioCard scenario={analysis.scenarios.C} />
      </div>
      <div className="grid gap-3 rounded-lg border border-border p-4 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Confirmed mandatory costs" value={formatCurrency(analysis.confirmedMandatory)} />
        <Stat label="Optional costs selected" value={formatCurrency(analysis.optionalSelected)} />
        <Stat label="Estimated additional costs" value={formatCurrency(analysis.estimatedAdditional)} />
        <Stat label="Unpriced services still required" value={String(analysis.unpricedRequired)} />
        <Stat label="Cost completeness" value={pct(analysis.completeness)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-foreground/50">{label}</div>
      <div className="font-medium text-ink">{value}</div>
    </div>
  );
}
