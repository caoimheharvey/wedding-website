"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { createWeddingIdea, deleteWeddingIdea, type IdeaActionState } from "@/lib/ideas/actions";
import type { WeddingIdea } from "@/lib/ideas/types";

const initialState: IdeaActionState = undefined;

function IdeaCard({ idea }: { idea: WeddingIdea }) {
  const [isPending, startTransition] = useTransition();

  return (
    <article className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-medium text-ink">{idea.title}</h2>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await deleteWeddingIdea(idea.id);
            });
          }}
          className="shrink-0 text-xs text-foreground/40 hover:text-terracotta disabled:opacity-50"
        >
          Remove
        </button>
      </div>
      {idea.description && <p className="text-sm text-foreground/60">{idea.description}</p>}
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
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
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
