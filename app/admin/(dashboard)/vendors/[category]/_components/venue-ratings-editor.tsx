"use client";

import { useState, useTransition } from "react";
import { saveVenueRatings } from "@/lib/venues/costs/actions";
import { RATING_CRITERIA } from "@/lib/venues/analysis/catalogue";
import type { VenueRating } from "@/lib/venues/analysis/types";
import { SaveBar } from "./venue-editor-parts";

const SCORES = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

interface Row {
  score: string;
  reasoning: string;
}

export function VenueRatingsEditor({
  vendorId,
  category,
  ratings,
  evaluationNotes,
}: {
  vendorId: string;
  category: string;
  ratings: VenueRating[];
  evaluationNotes: string | null;
}) {
  const saved = new Map(ratings.map((rating) => [rating.criterionKey, rating]));
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(
      RATING_CRITERIA.map((criterion) => {
        const rating = saved.get(criterion.key);
        return [criterion.key, { score: rating ? String(rating.score) : "", reasoning: rating?.reasoning ?? "" }];
      }),
    ),
  );
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ message?: string; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const update = (key: string, patch: Partial<Row>) => {
    setRows((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
    setDirty((current) => new Set(current).add(key));
  };

  const save = () =>
    startTransition(async () => {
      const response = await saveVenueRatings(
        vendorId,
        category,
        [...dirty].map((key) => ({
          criterionKey: key,
          score: rows[key].score === "" ? null : Number(rows[key].score),
          reasoning: rows[key].reasoning.trim() === "" ? null : rows[key].reasoning,
        })),
      );
      setResult(response);
      if (!response.error) setDirty(new Set());
    });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground/60">
        Our own judgement, 0–5. These are the only subjective scores in the rankings. Leave a criterion
        unrated until we have a real view; it is then left out, not scored as average.
      </p>
      {evaluationNotes && <p className="rounded-lg border border-border p-3 text-sm text-ink">{evaluationNotes}</p>}
      {RATING_CRITERIA.map((criterion) => (
        <div key={criterion.key} className="grid items-center gap-2 sm:grid-cols-[minmax(12rem,1fr)_6rem_2fr]">
          <div className="text-sm text-ink">
            {criterion.label}
            <div className="text-xs text-foreground/50">{criterion.hint}</div>
          </div>
          <select
            aria-label={`${criterion.label} score`}
            value={rows[criterion.key].score}
            onChange={(event) => update(criterion.key, { score: event.target.value })}
            className="input !px-2 !py-1 text-sm"
          >
            <option value="">Not rated</option>
            {SCORES.map((score) => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
          </select>
          <input
            aria-label={`${criterion.label} reasoning`}
            value={rows[criterion.key].reasoning}
            onChange={(event) => update(criterion.key, { reasoning: event.target.value })}
            placeholder="Why (shown in the ranking breakdown)"
            className="input !px-2 !py-1 text-sm"
          />
        </div>
      ))}
      <SaveBar pending={pending} dirtyCount={dirty.size} onSave={save} message={result.message} error={result.error} label="Save ratings" />
    </div>
  );
}
