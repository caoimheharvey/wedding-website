"use client";

import { useActionState, useState, useTransition } from "react";
import { PLANNING_PHASES } from "@/lib/planning/phases";
import {
  createChecklistItem,
  suggestChecklistPhaseAction,
  type ChecklistActionState,
} from "@/lib/planning/actions";
import type { PlanningPhaseId } from "@/lib/planning/types";

const initialState: ChecklistActionState = undefined;

export function AddChecklistItemSection({
  defaultPhaseId,
}: {
  defaultPhaseId: PlanningPhaseId | null;
}) {
  const [adding, setAdding] = useState(false);
  const [phaseId, setPhaseId] = useState<PlanningPhaseId>(defaultPhaseId ?? "details");
  const [suggestMessage, setSuggestMessage] = useState<string | null>(null);
  const [isSuggesting, startSuggestTransition] = useTransition();
  const [state, formAction, isPending] = useActionState(createChecklistItem, initialState);

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="self-start rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
      >
        + Add task
      </button>
    );
  }

  function handleSuggest(form: HTMLFormElement) {
    const title = String(new FormData(form).get("title") ?? "");
    const description = String(new FormData(form).get("description") ?? "");
    setSuggestMessage(null);
    startSuggestTransition(async () => {
      const result = await suggestChecklistPhaseAction(title, description);
      if (result.phaseId) setPhaseId(result.phaseId);
      if (result.message) setSuggestMessage(result.message);
    });
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 glass-card p-4"
    >
      <h2 className="font-display text-lg text-ink">Add checklist task</h2>
      <input type="hidden" name="phaseId" value={phaseId} />
      <label className="flex flex-col gap-1 text-left text-sm">
        <span className="font-medium text-ink">Task</span>
        <input
          type="text"
          name="title"
          required
          placeholder="e.g. Book rehearsal dinner venue"
          className="input"
        />
        {state?.errors?.title && (
          <span className="text-xs text-terracotta">{state.errors.title[0]}</span>
        )}
      </label>
      <label className="flex flex-col gap-1 text-left text-sm">
        <span className="font-medium text-ink">Notes (optional)</span>
        <textarea
          name="description"
          rows={2}
          placeholder="Any extra detail for yourselves"
          className="input resize-y"
        />
      </label>
      <div className="flex flex-col gap-2 text-left text-sm">
        <span className="font-medium text-ink">Planning stage</span>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={phaseId}
            onChange={(event) => setPhaseId(event.target.value as PlanningPhaseId)}
            className="input w-auto min-w-[12rem] flex-1"
          >
            {PLANNING_PHASES.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isSuggesting}
            onClick={(event) => handleSuggest(event.currentTarget.form!)}
            className="rounded-full border border-aegean px-3 py-1.5 text-xs font-medium text-aegean transition hover:bg-aegean/5 disabled:opacity-50"
          >
            {isSuggesting ? "Suggesting…" : "Suggest stage with AI"}
          </button>
        </div>
        <p className="text-xs text-foreground/50">
          Uses your Anthropic API key to pick the best timeline stage for this task.
        </p>
        {suggestMessage && <p className="text-xs text-terracotta">{suggestMessage}</p>}
        {state?.errors?.phaseId && (
          <span className="text-xs text-terracotta">{state.errors.phaseId[0]}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add task"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAdding(false);
            setSuggestMessage(null);
          }}
          className="text-sm text-foreground/60 hover:underline"
        >
          Cancel
        </button>
      </div>
      {state?.message && <p className="text-sm text-olive">{state.message}</p>}
    </form>
  );
}
