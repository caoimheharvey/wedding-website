"use client";

import { useState, useTransition } from "react";
import { aiTranslateSection } from "@/lib/guest-view/ai-actions";
import { updateHeaderLabel } from "@/lib/rsvp/actions";

export function HeaderLabelEditor({
  headerLabel,
  headerLabelFr,
  headerLabelZh,
  autoLabel,
}: {
  headerLabel: string | null;
  headerLabelFr: string | null;
  headerLabelZh: string | null;
  /** What the guest site would show right now if left on automatic. */
  autoLabel: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(headerLabel ?? "");
  const [valueFr, setValueFr] = useState(headerLabelFr ?? "");
  const [valueZh, setValueZh] = useState(headerLabelZh ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function translate(target: "fr" | "zh") {
    startTransition(async () => {
      const result = await aiTranslateSection(value, target);
      if (result.text) {
        (target === "fr" ? setValueFr : setValueZh)(result.text);
        setMessage(null);
      } else {
        setMessage(result.message ?? "Translation failed.");
      }
    });
  }

  if (!isEditing) {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium tracking-wide text-foreground/50 uppercase">
          Guest site header label
        </p>
        <div className="flex items-center gap-2">
          <p className="font-display text-lg text-ink">{headerLabel || autoLabel}</p>
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
            Automatic — changes on its own as the wedding date and RSVP deadline get set, and is
            translated for French and Mandarin guests.
          </p>
        )}
        {headerLabel && (!headerLabelFr || !headerLabelZh) && (
          <p className="text-xs text-terracotta">
            Missing a {!headerLabelFr ? "French" : ""}
            {!headerLabelFr && !headerLabelZh ? " and " : ""}
            {!headerLabelZh ? "Mandarin" : ""} version — those guests see the automatic label
            instead.
          </p>
        )}
      </div>
    );
  }

  const fields = [
    { id: "headerLabel", label: "English", value, set: setValue, target: null },
    { id: "headerLabelFr", label: "French", value: valueFr, set: setValueFr, target: "fr" as const },
    { id: "headerLabelZh", label: "Mandarin", value: valueZh, set: setValueZh, target: "zh" as const },
  ];

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <p className="text-sm font-medium text-ink">Header label</p>
      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1">
          <label htmlFor={field.id} className="text-xs text-ink">
            {field.label}
          </label>
          <div className="flex items-center gap-2">
            <input
              id={field.id}
              type="text"
              value={field.value}
              onChange={(event) => field.set(event.target.value)}
              placeholder={
                field.target ? "Leave blank to use the automatic label" : `Leave blank for automatic (currently "${autoLabel}")`
              }
              className="input flex-1"
            />
            {field.target && (
              <button
                type="button"
                disabled={isPending || !value.trim()}
                onClick={() => translate(field.target)}
                className="shrink-0 text-xs font-medium text-aegean hover:underline disabled:opacity-40"
              >
                Translate
              </button>
            )}
          </div>
        </div>
      ))}
      {message && <p className="text-sm text-terracotta">{message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            startTransition(async () => {
              await updateHeaderLabel(value.trim() || null, valueFr.trim() || null, valueZh.trim() || null);
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
                await updateHeaderLabel(null, null, null);
                setValue("");
                setValueFr("");
                setValueZh("");
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
            setValueFr(headerLabelFr ?? "");
            setValueZh(headerLabelZh ?? "");
            setMessage(null);
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
