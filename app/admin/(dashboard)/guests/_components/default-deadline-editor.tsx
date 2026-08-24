"use client";

import { useState, useTransition } from "react";
import { updateDefaultRsvpDeadline } from "@/lib/rsvp/actions";

export function DefaultDeadlineEditor({ deadline }: { deadline: string | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(deadline ?? "");
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink">
        <span>
          Default RSVP deadline:{" "}
          {deadline ? deadline : <span className="text-foreground/50">Not set</span>}
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-xs font-medium text-foreground/40 hover:text-aegean"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 glass-card px-4 py-3">
      <label htmlFor="defaultRsvpDeadline" className="text-sm font-medium text-ink">
        Default RSVP deadline
      </label>
      <input
        id="defaultRsvpDeadline"
        type="date"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="input w-auto"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await updateDefaultRsvpDeadline(value || null);
            setIsEditing(false);
          });
        }}
        className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => {
          setValue(deadline ?? "");
          setIsEditing(false);
        }}
        className="text-sm text-foreground/60 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
