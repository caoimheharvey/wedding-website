"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  createWeddingIdea,
  deleteWeddingIdea,
  promoteWeddingIdea,
  type IdeaActionState,
} from "@/lib/ideas/actions";
import { PLANNING_PHASES } from "@/lib/planning/phases";
import type { PlanningPhaseId } from "@/lib/planning/types";
import type { WeddingIdea } from "@/lib/ideas/types";

const initialState: IdeaActionState = undefined;

function IdeaCard({ idea }: { idea: WeddingIdea }) {
  const [isPending, startTransition] = useTransition();
  const [promoting, setPromoting] = useState(false);
  const [phaseId, setPhaseId] = useState(PLANNING_PHASES[0].id);
  const [promoteMessage, setPromoteMessage] = useState<string | null>(null);

  return (
    <article className="flex flex-col gap-2 glass-card p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium text-ink">{idea.title}</h2>
        <div className="flex shrink-0 items-center gap-3">
          {!promoting && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setPromoting(true)}
              className="text-xs text-aegean hover:underline disabled:opacity-50"
            >
              Promote to checklist
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await deleteWeddingIdea(idea.id);
              });
            }}
            className="text-xs text-foreground/40 hover:text-terracotta disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
      {idea.description && <p className="text-sm text-foreground/60">{idea.description}</p>}

      {promoting && (
        <div className="mt-1 flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-background/40 p-2">
          <select
            value={phaseId}
            onChange={(event) => setPhaseId(event.target.value as PlanningPhaseId)}
            className="input w-auto text-xs"
          >
            {PLANNING_PHASES.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                const result = await promoteWeddingIdea(idea.id, phaseId);
                if (result.message === "Idea moved to checklist.") {
                  setPromoting(false);
                } else {
                  setPromoteMessage(result.message ?? null);
                }
              });
            }}
            className="rounded-full bg-aegean px-3 py-1 text-xs font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
          >
            {isPending ? "Moving…" : "Add to checklist"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPromoting(false);
              setPromoteMessage(null);
            }}
            className="text-xs text-foreground/60 hover:underline"
          >
            Cancel
          </button>
          {promoteMessage && <p className="w-full text-xs text-terracotta">{promoteMessage}</p>}
        </div>
      )}
    </article>
  );
}

function AddIdeaForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(createWeddingIdea, initialState);

  useEffect(() => {
    if (state?.message === "Idea added.") onDone();
  }, [state?.message, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 glass-card p-4"
    >
      <label className="flex flex-col gap-1 text-left text-sm">
        <span className="font-medium text-ink">Idea</span>
        <input
          type="text"
          name="title"
          required
          autoFocus
          placeholder="e.g. Guest bingo at each table"
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
          rows={3}
          placeholder="How it might work, when you'd do it, things to figure out…"
          className="input resize-y"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add idea"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm text-foreground/60 hover:underline"
        >
          Cancel
        </button>
      </div>
      {state?.message && state.message !== "Idea added." && (
        <p className="text-sm text-terracotta">{state.message}</p>
      )}
    </form>
  );
}

export function IdeasSection({ ideas }: { ideas: WeddingIdea[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 text-left">
            <h1 className="font-display text-2xl text-ink">Ideas</h1>
            <p className="mt-1 text-sm text-foreground/60">
              Fun touches, games, and moments you want to explore — separate from your timeline
              checklist.
            </p>
          </div>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="shrink-0 rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
            >
              + Add idea
            </button>
          )}
        </div>
        {adding && <AddIdeaForm onDone={() => setAdding(false)} />}
      </header>

      {ideas.length === 0 ? (
        <p className="text-sm text-foreground/60">
          No ideas yet — capture fun touches, games, and moments you want to try.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </section>
  );
}
