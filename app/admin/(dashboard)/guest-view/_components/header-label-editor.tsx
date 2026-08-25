"use client";

import { useState, useTransition } from "react";
import { updateHeaderLabel } from "@/lib/rsvp/actions";

export function HeaderLabelEditor({
  headerLabel,
  autoLabel,
}: {
  headerLabel: string | null;
  /** What the guest site would show right now if left on automatic. */
  autoLabel: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(headerLabel ?? "");
  const [isPending, startTransition] = useTransition();

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">
          Guest site header label
        </p>
        <div className="flex items-center gap-2">
          <p className="font-display text-lg text-ink">
            {headerLabel || autoLabel}
          </p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-foreground/40 hover:text-aegean"
          >
            Edit
          </button>
        </div>
        {!headerLabel && (
          <p className="text-xs text-foreground/50">
            Automatic — changes on its own as the wedding date and RSVP deadline get set.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <label htmlFor="headerLabel" className="text-sm font-medium text-ink">
        Header label
      </label>
      <input
        id="headerLabel"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={`Leave blank for automatic (currently "${autoLabel}")`}
        className="input"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await updateHeaderLabel(value.trim() || null);
              setIsEditing(false);
            });
          }}
          className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {value && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              startTransition(async () => {
                await updateHeaderLabel(null);
                setValue("");
                setIsEditing(false);
              });
            }}
            className="text-sm font-medium text-terracotta hover:underline disabled:opacity-50"
          >
            Use automatic
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setValue(headerLabel ?? "");
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
