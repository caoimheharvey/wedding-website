"use client";

import { useState, useTransition } from "react";
import { updateDestination } from "@/lib/rsvp/actions";

export function DestinationEditor({ destination }: { destination: string | null }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(destination ?? "");
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">Destination</p>
        <div className="flex items-center gap-2">
          <p className="font-display text-lg text-ink">{destination || "Not set yet"}</p>
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
    <div className="flex flex-col gap-3">
      <label htmlFor="destination" className="text-sm font-medium text-ink">
        Destination
      </label>
      <input
        id="destination"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="e.g. Andalucía (Sevilla / Cádiz area)"
        className="input"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await updateDestination(value.trim() || null);
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
            setValue(destination ?? "");
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
