"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/budget/format";
import { ASSUMPTIONS, MIN_COMPLETENESS_TO_RANK, MIN_COVERAGE_TO_RANK } from "@/lib/venues/analysis/assumptions";
import type { VenueAnalysis } from "@/lib/venues/analysis/analyse";
import { buildDecisionData, type VenueDecisionInput, type VenueFacts } from "@/lib/venues/analysis/decision";
import type { Range } from "@/lib/venues/analysis/scenarios";
import type { ScoreEntry } from "@/lib/venues/analysis/rankings";
import { ALL_AROUND_WEIGHTS, FIT_WEIGHTS } from "@/lib/venues/analysis/rankings";
import { DOG_POLICIES, DOG_POLICY_LABELS, type DogPolicy } from "@/lib/venues/analysis/types";
import { COORDINATION_LABELS, type CoordinationType } from "@/lib/venues/types";

const DASH = "—";

const SORTS = [
  { id: "cheapest", label: "Cheapest total" },
  { id: "allAround", label: "Best all-around score" },
  { id: "fit", label: "Best overall fit" },
  { id: "additional", label: "Lowest additional costs" },
  { id: "complete", label: "Most complete package" },
  { id: "confidence", label: "Highest information confidence" },
] as const;
type SortId = (typeof SORTS)[number]["id"];

/** Filters on the structured dog fields (never on notes text). */
export type DogFilter = "any" | DogPolicy | "pet_friendly_stay";

export function matchesDogFilter(facts: Pick<VenueFacts, "dogPolicy" | "dogAccommodation"> | undefined, filter: DogFilter): boolean {
  if (filter === "any") return true;
  if (filter === "pet_friendly_stay") return facts?.dogAccommodation === "welcome";
  return (facts?.dogPolicy ?? "unknown") === filter;
}

const pct = (value: number) => `${Math.round(value * 100)}%`;

function Money({ range, unpriced }: { range: Range; unpriced: number }) {
  // Nothing priced is "not priced", never "€0".
  if (range.high === 0) return <span className="text-foreground/40">Not priced yet</span>;
  const spread = range.high - range.low > 1;
  return (
    <div>
      <div className="font-medium text-ink">{formatCurrency(range.mid)}</div>
      {spread && (
        <div className="text-xs text-foreground/50">
          {formatCurrency(range.low)}–{formatCurrency(range.high)}
        </div>
      )}
      {unpriced > 0 && <div className="text-xs text-terracotta">+ {unpriced} unpriced</div>}
    </div>
  );
}

function Score({ entry }: { entry: ScoreEntry | undefined }) {
  if (!entry || entry.score === null) return <span className="text-foreground/40">{DASH}</span>;
  return (
    <div>
      <div className="font-medium text-ink">{entry.score}/100</div>
      <div className="text-xs text-foreground/50">
        {pct(entry.coverage)} scored{entry.rank === null ? " · provisional" : ""}
      </div>
    </div>
  );
}

function rankText(rank: number | null | undefined) {
  return rank ? `#${rank}` : DASH;
}

export function VenueDecisionDashboard({
  venues,
  category,
}: {
  venues: VenueDecisionInput[];
  category: string;
}) {
  const [adults, setAdults] = useState<number>(ASSUMPTIONS.adults);
  const [sort, setSort] = useState<SortId>("cheapest");
  const [dogFilter, setDogFilter] = useState<DogFilter>("any");
  const data = useMemo(() => buildDecisionData(venues, adults), [venues, adults]);

  const cheapestRank = new Map(data.rankings.cheapest.map((entry) => [entry.vendorId, entry.rank]));
  const allAround = new Map(data.rankings.allAround.map((entry) => [entry.vendorId, entry]));
  const fit = new Map(data.rankings.fit.map((entry) => [entry.vendorId, entry]));

  const rows = data.analyses.filter((analysis) => matchesDogFilter(data.facts[analysis.vendorId], dogFilter)).sort((a, b) => {
    const byName = a.name.localeCompare(b.name);
    switch (sort) {
      case "cheapest":
        return (cheapestRank.get(a.vendorId) ?? Infinity) - (cheapestRank.get(b.vendorId) ?? Infinity) || byName;
      case "allAround":
        return (allAround.get(a.vendorId)?.rank ?? Infinity) - (allAround.get(b.vendorId)?.rank ?? Infinity) ||
          (allAround.get(b.vendorId)?.score ?? -1) - (allAround.get(a.vendorId)?.score ?? -1) || byName;
      case "fit":
        return (fit.get(a.vendorId)?.rank ?? Infinity) - (fit.get(b.vendorId)?.rank ?? Infinity) ||
          (fit.get(b.vendorId)?.score ?? -1) - (fit.get(a.vendorId)?.score ?? -1) || byName;
      case "additional":
        return a.mandatoryAdditional - b.mandatoryAdditional || byName;
      case "complete":
        return b.completeness - a.completeness || byName;
      case "confidence":
        return b.infoConfidence - a.infoConfidence || byName;
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 glass-card p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-ink">Venue decision dashboard</h2>
            <p className="max-w-3xl text-sm text-foreground/60">
              Every venue on the same plan: {ASSUMPTIONS.format} Unpriced items are never counted as
              free, and unknown is never treated as included or excluded.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 text-ink">
              Adult guests
              <input
                type="number"
                min="1"
                value={adults}
                onChange={(event) => setAdults(Math.max(1, Number(event.target.value) || 1))}
                className="input w-24"
              />
            </label>
            <label className="flex items-center gap-2 text-ink">
              Dogs
              <select
                aria-label="Filter by dog policy"
                value={dogFilter}
                onChange={(event) => setDogFilter(event.target.value as DogFilter)}
                className="input w-auto"
              >
                <option value="any">Any</option>
                {DOG_POLICIES.map((policy) => (
                  <option key={policy} value={policy}>
                    {DOG_POLICY_LABELS[policy]} at the wedding
                  </option>
                ))}
                <option value="pet_friendly_stay">Dog-friendly accommodation</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-ink">
              Sort by
              <select value={sort} onChange={(event) => setSort(event.target.value as SortId)} className="input w-auto">
                {SORTS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-foreground/60">
            {data.analyses.length === 0
              ? "No venues yet. Add one to start comparing."
              : "No venues match this dog-policy filter. Choose \u201cAny\u201d to see them all."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="border-b border-border text-xs tracking-wide text-foreground/50 uppercase">
                <tr>
                  {[
                    "Venue",
                    "Location",
                    "Availability",
                    "Cheapest est. total (A)",
                    "Realistic est. total (B)",
                    "Cost per adult (B)",
                    "Mandatory additional costs",
                    "Unpriced services",
                    "Package completeness",
                    "Included",
                    "Additional cost",
                    "Not provided",
                    "Coordination",
                    "Accommodation",
                    "Dog policy",
                    "All-around score",
                    "Overall fit score",
                    "Current ranking",
                    "Outstanding questions",
                  ].map((heading) => (
                    <th key={heading} className="py-2 pr-4 align-bottom font-medium">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((analysis) => (
                  <Row
                    key={analysis.vendorId}
                    analysis={analysis}
                    category={category}
                    facts={data.facts[analysis.vendorId]}
                    cheapestRank={cheapestRank.get(analysis.vendorId) ?? null}
                    allAround={allAround.get(analysis.vendorId)}
                    fit={fit.get(analysis.vendorId)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-foreground/50">
          A = stated minimums only · B = realistic wedding (adds the services we would need) · totals
          include VAT where known; when VAT is unknown the range shows both cases. Completeness is the
          share of the realistic wedding that has a price or is covered by the package.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <CheapestPanel entries={data.rankings.cheapest} />
        <ScorePanel
          title="Best all-around offer"
          blurb="Weighted score out of 100 using the actual package and what it costs to get our intended wedding."
          weights={ALL_AROUND_WEIGHTS.map((w) => `${w.label} ${w.weight}%`)}
          entries={data.rankings.allAround}
        />
        <ScorePanel
          title="Best overall fit"
          blurb="How well each venue matches what we said matters most."
          weights={FIT_WEIGHTS.map((w) => `${w.label} ${w.weight}`)}
          entries={data.rankings.fit}
        />
      </div>
    </div>
  );
}

function Row({
  analysis,
  category,
  facts,
  cheapestRank,
  allAround,
  fit,
}: {
  analysis: VenueAnalysis;
  category: string;
  facts: VenueFacts;
  cheapestRank: number | null;
  allAround: ScoreEntry | undefined;
  fit: ScoreEntry | undefined;
}) {
  const a = analysis.scenarios.A;
  const b = analysis.scenarios.B;
  const lowCompleteness = !analysis.priceRankable;

  return (
    <tr className="border-b border-border/60 align-top">
      <td className="py-3 pr-4">
        <Link
          href={`/admin/vendors/${category}/${analysis.vendorId}/edit`}
          className="font-display text-base text-aegean hover:underline"
        >
          {analysis.name}
        </Link>
        <div className="text-xs text-foreground/50">{pct(analysis.infoConfidence)} confirmed info</div>
      </td>
      <td className="max-w-[12rem] py-3 pr-4 text-foreground/70" title={facts.address ?? undefined}>
        {facts.location ?? facts.address ?? DASH}
      </td>
      <td className="max-w-[12rem] py-3 pr-4 text-foreground/70">{facts.availability ?? DASH}</td>
      <td className="py-3 pr-4">
        <Money range={a.total} unpriced={a.unpriced.length} />
      </td>
      <td className="py-3 pr-4">
        <Money range={b.total} unpriced={b.unpriced.length} />
      </td>
      <td className="py-3 pr-4 text-ink">{b.total.high === 0 ? DASH : formatCurrency(b.perAdult.mid)}</td>
      <td className="py-3 pr-4 text-ink">{analysis.mandatoryAdditional > 0 ? formatCurrency(analysis.mandatoryAdditional) : DASH}</td>
      <td className="py-3 pr-4">
        <span className={analysis.unpricedRequired > 0 ? "font-medium text-terracotta" : "text-foreground/60"}>
          {analysis.unpricedRequired}
        </span>
      </td>
      <td className="py-3 pr-4">
        <div className={`font-medium ${lowCompleteness ? "text-terracotta" : "text-olive"}`}>{pct(analysis.completeness)}</div>
        {lowCompleteness && (
          <div className="text-xs text-foreground/50">under {pct(MIN_COMPLETENESS_TO_RANK)}: not comparable</div>
        )}
      </td>
      <td className="py-3 pr-4 text-ink">{analysis.counts.included}</td>
      <td className="py-3 pr-4 text-ink">{analysis.counts.additional}</td>
      <td className="py-3 pr-4 text-ink">{analysis.counts.notProvided}</td>
      <td className="py-3 pr-4 text-foreground/70">
        {facts.coordination ? COORDINATION_LABELS[facts.coordination as CoordinationType] : DASH}
      </td>
      <td className="py-3 pr-4 text-foreground/70">{facts.accommodation.replace("_", " ")}</td>
      <td className="max-w-[14rem] py-3 pr-4 text-foreground/70">{facts.dogSummary}</td>
      <td className="py-3 pr-4">
        <Score entry={allAround} />
      </td>
      <td className="py-3 pr-4">
        <Score entry={fit} />
      </td>
      <td className="py-3 pr-4 text-xs text-foreground/70">
        <div>Cost {rankText(cheapestRank)}</div>
        <div>All-around {rankText(allAround?.rank)}</div>
        <div>Fit {rankText(fit?.rank)}</div>
      </td>
      <td className="max-w-[16rem] py-3 pr-4">
        <details>
          <summary className="cursor-pointer text-aegean">{analysis.questions.length} open</summary>
          <ul className="mt-1 list-disc pl-4 text-xs text-foreground/70">
            {analysis.questions.map((question, index) => (
              <li key={index}>{question.text}</li>
            ))}
          </ul>
        </details>
      </td>
    </tr>
  );
}

function CheapestPanel({ entries }: { entries: ReturnType<typeof buildDecisionData>["rankings"]["cheapest"] }) {
  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <div>
        <h3 className="font-display text-lg text-ink">Cheapest wedding</h3>
        <p className="text-sm text-foreground/60">
          Ranked on the realistic total (scenario B), not the headline menu price. A venue is only
          ranked once {pct(MIN_COMPLETENESS_TO_RANK)} of the intended wedding is priced, so not
          quoting for something can&apos;t make a venue look cheaper.
        </p>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-foreground/60">No venues yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.vendorId} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-ink">
                  {entry.rank ? `#${entry.rank} ` : ""}
                  {entry.name}
                </span>
                <span className="text-ink">{formatCurrency(entry.total.mid)}</span>
              </div>
              <div className="text-xs text-foreground/50">
                {formatCurrency(entry.total.low)}–{formatCurrency(entry.total.high)} · {formatCurrency(entry.perAdult.mid)} per adult ·{" "}
                {pct(entry.completeness)} priced
              </div>
              {entry.note && <div className="mt-1 text-xs text-terracotta">{entry.note}</div>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ScorePanel({
  title,
  blurb,
  weights,
  entries,
}: {
  title: string;
  blurb: string;
  weights: string[];
  entries: ScoreEntry[];
}) {
  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <div>
        <h3 className="font-display text-lg text-ink">{title}</h3>
        <p className="text-sm text-foreground/60">{blurb}</p>
        <details className="mt-1 text-xs text-foreground/60">
          <summary className="cursor-pointer text-aegean">How it&apos;s scored</summary>
          <p className="mt-1">
            Each criterion is 0–5 from facts we have (computed) and our own ratings (manual). A
            criterion with no information is left out, never given a default, and the score is
            normalised over what could be scored. A numeric rank needs at least{" "}
            {pct(MIN_COVERAGE_TO_RANK)} of the weight scored.
          </p>
          <ul className="mt-1 list-disc pl-4">
            {weights.map((weight) => (
              <li key={weight}>{weight}</li>
            ))}
          </ul>
        </details>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-foreground/60">No venues yet.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.vendorId} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-ink">
                  {entry.rank ? `#${entry.rank} ` : ""}
                  {entry.name}
                </span>
                <span className="text-ink">{entry.score === null ? DASH : `${entry.score}/100`}</span>
              </div>
              <div className="text-xs text-foreground/50">
                {pct(entry.coverage)} of the weight scored · {pct(entry.infoConfidence)} confirmed info
                {entry.rank === null && entry.score !== null ? " · provisional: rate more criteria to rank" : ""}
              </div>
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-aegean">Why this score</summary>
                <table className="mt-1 w-full text-xs">
                  <tbody>
                    {entry.criteria.map((criterion) => (
                      <tr key={criterion.key} className="border-t border-border/60 align-top">
                        <td className="py-1 pr-2 text-ink">
                          {criterion.label}
                          <span className="text-foreground/40"> ({criterion.weight})</span>
                        </td>
                        <td className="py-1 pr-2 whitespace-nowrap text-ink">
                          {criterion.score === null ? "not scored" : `${criterion.score}/5`}
                        </td>
                        <td className="py-1 text-foreground/60">
                          {criterion.parts.length === 0
                            ? "No information yet"
                            : criterion.parts.map((part, index) => (
                                <div key={index}>
                                  <span className="text-foreground/40">{part.source}:</span> {part.evidence}
                                </div>
                              ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
