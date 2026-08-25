"use client";

import { useActionState, useState } from "react";
import type { Guest } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { createAndSendCampaign, type ComposeMessageState } from "@/lib/messaging/actions";
import { RecipientPicker } from "./recipient-picker";

const initialState: ComposeMessageState = undefined;

export function ComposeMessageForm({
  guests,
  effectiveStatusById,
}: {
  guests: Guest[];
  effectiveStatusById: Record<string, EffectiveRsvpStatus>;
}) {
  const [state, formAction, isPending] = useActionState(createAndSendCampaign, initialState);
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  // Adjust state during render (React's recommended alternative to an
  // effect here) rather than after commit, avoiding an extra render tick.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.message?.startsWith("Sent to")) {
      setSubject("");
      setHtml("");
      setSelected(new Set());
    }
  }

  const canReview = subject.trim().length > 0 && html.trim().length > 0 && selected.size > 0;

  return (
    <form
      action={formAction}
      className="glass-card flex flex-col gap-5 p-4"
      onSubmit={() => setConfirming(false)}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="subject" className="text-sm font-medium text-ink">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          className="input"
          placeholder="Subject line"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="html" className="text-sm font-medium text-ink">
            Email HTML
          </label>
          <textarea
            id="html"
            name="html"
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            className="input h-64 font-mono text-xs"
            placeholder="Paste the HTML exported from Canva here…"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-ink">Preview</span>
          <div className="h-64 overflow-hidden rounded-md border border-border bg-whitewash">
            {html.trim() ? (
              <iframe
                title="Email preview"
                srcDoc={html}
                sandbox="allow-same-origin"
                className="h-full w-full"
              />
            ) : (
              <p className="p-3 text-sm text-foreground/50">Paste HTML to see a preview.</p>
            )}
          </div>
        </div>
      </div>

      <RecipientPicker
        guests={guests}
        effectiveStatusById={effectiveStatusById}
        selected={selected}
        onChange={setSelected}
      />

      {!confirming ? (
        <button
          type="button"
          disabled={!canReview}
          onClick={() => setConfirming(true)}
          className="self-start rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          Review &amp; send
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-sand/40 px-4 py-3">
          <span className="text-sm font-medium text-ink">
            Send &quot;{subject}&quot; to {selected.size} recipient{selected.size === 1 ? "" : "s"}?
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-terracotta px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-terracotta-light disabled:opacity-50"
          >
            {isPending ? "Sending…" : "Confirm send"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-sm text-foreground/60 hover:underline"
          >
            Cancel
          </button>
        </div>
      )}

      {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
      {state?.errors && (
        <ul className="text-sm text-terracotta">
          {Object.entries(state.errors).map(([field, messages]) =>
            messages?.map((message) => <li key={`${field}-${message}`}>{message}</li>),
          )}
        </ul>
      )}
    </form>
  );
}
