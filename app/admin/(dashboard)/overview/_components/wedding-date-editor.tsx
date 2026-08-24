"use client";

import { useState, useTransition } from "react";
import { updateWeddingDate, updateWeddingLocation } from "@/lib/rsvp/actions";
import { formatWeddingDate } from "@/lib/planning/countdown";

export function WeddingDateEditor({
  weddingDate,
  weddingLocation,
}: {
  weddingDate: string | null;
  weddingLocation: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dateValue, setDateValue] = useState(weddingDate ?? "");
  const [locationValue, setLocationValue] = useState(weddingLocation ?? "");
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-3">
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
        {weddingLocation && <p className="text-sm text-foreground/60">{weddingLocation}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <label htmlFor="weddingDate" className="text-sm font-medium text-ink">
        Wedding date
      </label>
      <input
        id="weddingDate"
        type="date"
        value={dateValue}
        onChange={(event) => setDateValue(event.target.value)}
        className="input w-auto"
      />
      <label htmlFor="weddingLocation" className="text-sm font-medium text-ink">
        Location (for guest calendar)
      </label>
      <input
        id="weddingLocation"
        type="text"
        value={locationValue}
        onChange={(event) => setLocationValue(event.target.value)}
        placeholder="e.g. Villa Cimbrone, Ravello"
        className="input"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await updateWeddingDate(dateValue === "" ? null : dateValue);
              await updateWeddingLocation(locationValue.trim() || null);
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
            setDateValue(weddingDate ?? "");
            setLocationValue(weddingLocation ?? "");
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
