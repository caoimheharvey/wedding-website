"use client";

import { UPDATE_KIND_LABELS, UPDATE_KINDS, type UpdateKind } from "@/lib/venues/types";
import type { Confidence, CostSource } from "@/lib/venues/analysis/types";

/** What confidence a source usually implies; used only to pre-fill, always editable. */
export const SUGGESTED_CONFIDENCE: Record<CostSource, Confidence> = {
  email: "confirmed_by_venue",
  quote: "confirmed_by_venue",
  brochure: "brochure",
  estimate: "indicative",
  assumption: "assumption",
};

export interface HistoryDraft {
  kind: UpdateKind;
  date: string;
  text: string;
}

export function HistoryFields({
  value,
  onChange,
}: {
  value: HistoryDraft;
  onChange: (next: HistoryDraft) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-border p-3 text-sm sm:grid-cols-[auto_auto_1fr]">
      <label className="flex flex-col gap-1 text-ink">
        This change comes from
        <select
          value={value.kind}
          onChange={(event) => onChange({ ...value, kind: event.target.value as UpdateKind })}
          className="input"
        >
          {UPDATE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {UPDATE_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-ink">
        Date
        <input
          type="date"
          value={value.date}
          onChange={(event) => onChange({ ...value, date: event.target.value })}
          className="input"
        />
      </label>
      <label className="flex flex-col gap-1 text-ink">
        Original text (optional, kept in the history)
        <textarea
          value={value.text}
          onChange={(event) => onChange({ ...value, text: event.target.value })}
          rows={2}
          placeholder="Paste the email or quote this came from"
          className="input"
        />
      </label>
    </div>
  );
}

export function SaveBar({
  pending,
  dirtyCount,
  onSave,
  message,
  error,
  label = "Save changes",
}: {
  pending: boolean;
  dirtyCount: number;
  onSave: () => void;
  message?: string;
  error?: string;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={pending || dirtyCount === 0}
        className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
      >
        {pending ? "Saving…" : label}
      </button>
      <span className="text-xs text-foreground/50">
        {dirtyCount === 0 ? "No unsaved changes" : `${dirtyCount} unsaved`}
      </span>
      {message && <span className="text-sm text-olive">{message}</span>}
      {error && <span className="text-sm text-terracotta">{error}</span>}
    </div>
  );
}
