"use client";

import { useActionState } from "react";
import {
  generateDestinationsAction,
  type GenerateDestinationsState,
} from "@/lib/destinations/actions";

const initialState: GenerateDestinationsState = undefined;

export function GenerateDestinationsForm() {
  const [state, formAction, isPending] = useActionState(generateDestinationsAction, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-aegean/30 bg-aegean-light/5 p-4"
    >
      <div>
        <h2 className="font-display text-lg text-ink">Research destinations with AI</h2>
        <p className="text-xs text-foreground/60">
          List places you&apos;re considering (one per line, or comma-separated) — Claude will fill
          in the tiles below based on your checklist above, and suggest a few other places worth a
          look.
        </p>
      </div>
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
  );
}
