"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  createWeddingDecision,
  deleteWeddingDecision,
  updateWeddingDecision,
  type DecisionActionState,
} from "@/lib/decisions/actions";
import type { WeddingDecision } from "@/lib/decisions/types";

const initialState: DecisionActionState = undefined;

function formatDecidedDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function DecisionFormFields({
  decision,
  errors,
}: {
  decision?: WeddingDecision;
  errors?: Record<string, string[]>;
}) {
  return (
    <>
      <label className="flex flex-col gap-1 text-left text-sm">
        <span className="font-medium text-ink">Title</span>
        <input
          type="text"
          name="title"
          defaultValue={decision?.title}
          required
          autoFocus
          placeholder="e.g. Going with a live band over a DJ"
          className="input"
        />
        {errors?.title && <span className="text-xs text-terracotta">{errors.title[0]}</span>}
      </label>
      <label className="flex flex-col gap-1 text-left text-sm">
        <span className="font-medium text-ink">Description (optional)</span>
        <textarea
          name="description"
          defaultValue={decision?.description ?? ""}
          rows={3}
          placeholder="What was decided and why…"
          className="input resize-y"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-left text-sm">
          <span className="font-medium text-ink">Link (optional)</span>
          <input
            type="text"
            name="link"
            defaultValue={decision?.link ?? ""}
            placeholder="https://…"
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-left text-sm">
          <span className="font-medium text-ink">Date decided (optional)</span>
          <input
            type="date"
            name="decidedDate"
            defaultValue={decision?.decidedDate ?? ""}
            className="input"
          />
        </label>
      </div>
    </>
  );
}

function EditDecisionForm({ decision, onDone }: { decision: WeddingDecision; onDone: () => void }) {
  const action = updateWeddingDecision.bind(null, decision.id);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.message === "Decision updated.") onDone();
  }, [state?.message, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <DecisionFormFields decision={decision} errors={state?.errors} />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-foreground/60 hover:underline">
          Cancel
        </button>
      </div>
      {state?.message && state.message !== "Decision updated." && (
        <p className="text-sm text-terracotta">{state.message}</p>
      )}
    </form>
  );
}

function DecisionCard({ decision }: { decision: WeddingDecision }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <article className="rounded-lg border border-border bg-surface p-4 text-left">
        <EditDecisionForm decision={decision} onDone={() => setEditing(false)} />
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-medium text-ink">{decision.title}</h2>
          {decision.decidedDate && (
            <p className="text-xs text-foreground/50">Decided {formatDecidedDate(decision.decidedDate)}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-aegean hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await deleteWeddingDecision(decision.id);
              });
            }}
            className="text-xs text-foreground/40 hover:text-terracotta disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
      {decision.description && <p className="text-sm text-foreground/60">{decision.description}</p>}
      {decision.link && (
        <a
          href={decision.link}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-aegean hover:underline"
        >
          {decision.link}
        </a>
      )}
    </article>
  );
}

function AddDecisionForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(createWeddingDecision, initialState);

  useEffect(() => {
    if (state?.message === "Decision added.") onDone();
  }, [state?.message, onDone]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <DecisionFormFields errors={state?.errors} />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
        >
          {isPending ? "Adding…" : "Add decision"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-foreground/60 hover:underline">
          Cancel
        </button>
      </div>
      {state?.message && state.message !== "Decision added." && (
        <p className="text-sm text-terracotta">{state.message}</p>
      )}
    </form>
  );
}

export function DecisionsSection({ decisions }: { decisions: WeddingDecision[] }) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 text-left">
            <h1 className="font-display text-2xl text-ink">Decisions</h1>
            <p className="mt-1 text-sm text-foreground/60">
              A record of choices you&apos;ve already made — so you don&apos;t have to relitigate them
              later.
            </p>
          </div>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="shrink-0 rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light"
            >
              + Add decision
            </button>
          )}
        </div>
        {adding && <AddDecisionForm onDone={() => setAdding(false)} />}
      </header>

      {decisions.length === 0 ? (
        <p className="text-sm text-foreground/60">
          No decisions logged yet — record the choices you&apos;ve made as you go.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {decisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))}
        </div>
      )}
    </section>
  );
}
