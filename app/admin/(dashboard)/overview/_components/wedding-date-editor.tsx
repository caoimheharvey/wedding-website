"use client";

import { useState, useTransition } from "react";
import { updateWeddingDate } from "@/lib/rsvp/actions";
import { formatWeddingDate } from "@/lib/planning/countdown";

export function WeddingDateEditor({ weddingDate }: { weddingDate: string | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(weddingDate ?? "");
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">Wedding date</p>
        <div className="flex items-center gap-2">
          <p className="font-display text-lg text-ink">
            {weddingDate ? formatWeddingDate(weddingDate) : "Not set yet"}
          </p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-foreground/40 hover:text-aegean"
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <label htmlFor="weddingDate" className="text-sm font-medium text-ink">
        Wedding date
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          id="weddingDate"
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
              await updateWeddingDate(value === "" ? null : value);
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
            setValue(weddingDate ?? "");
            setIsEditing(false);
          }}
          className="text-sm text-foreground/60 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
