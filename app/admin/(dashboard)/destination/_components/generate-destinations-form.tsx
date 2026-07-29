"use client";

import { useActionState, useState } from "react";
import {
  generateDestinationsAction,
  updateDestinationsWithAiAction,
  type GenerateDestinationsState,
} from "@/lib/destinations/actions";

const initialState: GenerateDestinationsState = undefined;

function UpdateExistingWithAiForm() {
  const [state, formAction, isPending] = useActionState(updateDestinationsWithAiAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-aegean px-4 py-1.5 text-xs font-medium text-aegean transition hover:bg-aegean/10 disabled:opacity-50"
      >
        {isPending ? "Updating…" : "Update existing tiles with AI"}
      </button>
      {state?.message && <p className="text-xs text-foreground/60">{state.message}</p>}
    </form>
  );
}

export function GenerateDestinationsForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(generateDestinationsAction, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="self-start rounded-full border border-aegean px-4 py-2 text-sm font-medium text-aegean transition hover:bg-aegean/10"
      >
        Research destinations with AI
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-aegean/30 bg-aegean-light/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg text-ink">Research destinations with AI</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-foreground/60 hover:underline"
        >
          Close
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        <p className="text-xs text-foreground/60">
          List places you&apos;re considering (one per line, or comma-separated) — Claude will fill
          in the tiles below based on your checklist above, and suggest a few other places worth a
          look.
        </p>
        <textarea
          name="candidates"
          required
          rows={3}
          placeholder={"Turkey\nAlgarve\nSpain"}
          className="input resize-y"
        />
        <div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
          >
            {isPending ? "Researching…" : "Generate with AI"}
          </button>
        </div>
        {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
      </form>

      <div className="border-t border-aegean/20 pt-3">
        <p className="mb-2 text-xs text-foreground/60">
          Refresh every existing tile&apos;s details without adding any new ones or suggestions.
        </p>
        <UpdateExistingWithAiForm />
      </div>
    </div>
  );
}
