"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSectionStyle, type GuestViewSectionActionState } from "@/lib/guest-view/actions";
import {
  DECOR_POSITIONS,
  DECOR_SIZES,
  type DecorPosition,
  type DecorSize,
  type GuestViewSection,
} from "@/lib/guest-view/types";

const initialState: GuestViewSectionActionState = undefined;

const POSITION_LABELS: Record<DecorPosition, string> = {
  "top-left": "Top left",
  "top-center": "Top centre",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-center": "Bottom centre",
  "bottom-right": "Bottom right",
};
const SIZE_LABELS: Record<DecorSize, string> = { sm: "Small", md: "Medium", lg: "Large" };

/** Palette taken from the Canva template the guest site is styled after. */
const SWATCHES = [
  { label: "Sage green", value: "#d2e4b4" },
  { label: "Cream", value: "#f6f2e7" },
  { label: "Warm white", value: "#fffefc" },
];

interface DecorRow {
  existingUrl: string;
  previewUrl: string;
  position: DecorPosition;
  size: DecorSize;
}

export function SectionStyleForm({
  section,
  onDone,
}: {
  section: GuestViewSection;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateSectionStyle.bind(null, section.id),
    initialState,
  );
  const style = section.style;
  const [bgColor, setBgColor] = useState(style?.bgColor ?? "");
  const [rows, setRows] = useState<DecorRow[]>(
    (style?.decor ?? []).map((decor) => ({
      existingUrl: decor.url,
      previewUrl: decor.url,
      position: decor.position,
      size: decor.size,
    })),
  );

  useEffect(() => {
    if (state?.message === "Style updated.") onDone();
  }, [state, onDone]);

  function updateRow(index: number, patch: Partial<DecorRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 glass-card p-4">
      <div>
        <p className="font-medium text-ink">Style this section</p>
        <p className="text-xs text-foreground/50">
          Give it a full-width coloured band with artwork (e.g. florals exported from Canva as
          transparent PNG/SVG) pinned to its edges. Leave everything empty for the plain card.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-sm text-ink">
        Background colour
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(bgColor) ? bgColor : "#fffefc"}
            onChange={(event) => setBgColor(event.target.value)}
            className="h-9 w-12 cursor-pointer rounded border border-border"
            aria-label="Pick background colour"
          />
          <input
            name="bgColor"
            value={bgColor}
            onChange={(event) => setBgColor(event.target.value)}
            placeholder="#fffefc (blank = none)"
            className="input w-48"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {SWATCHES.map((swatch) => (
            <button
              key={swatch.value}
              type="button"
              onClick={() => setBgColor(swatch.value)}
              className="flex items-center gap-1.5 rounded-full border border-border px-2 py-1 text-xs text-ink hover:border-aegean"
            >
              <span
                className="h-3.5 w-3.5 rounded-full border border-border"
                style={{ backgroundColor: swatch.value }}
              />
              {swatch.label}
            </button>
          ))}
        </div>
      </label>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="fadeIn"
          defaultChecked={style?.fadeIn}
          className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
        />
        Fade in as guests scroll to it
      </label>

      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink">Artwork</p>
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2"
          >
            {row.previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary uploaded artwork
              <img src={row.previewUrl} alt="" className="h-16 w-16 rounded-md bg-sand/50 object-contain" />
            )}
            <input type="hidden" name="decorExistingUrl" value={row.existingUrl} />
            <label className="flex flex-col gap-1 text-xs text-ink">
              {row.existingUrl ? "Replace artwork" : "Artwork"}
              <input
                type="file"
                name="decorFile"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  updateRow(index, {
                    previewUrl: file ? URL.createObjectURL(file) : row.existingUrl,
                  });
                }}
                className="text-xs"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink">
              Position
              <select
                name="decorPosition"
                value={row.position}
                onChange={(event) => updateRow(index, { position: event.target.value as DecorPosition })}
                className="input w-auto"
              >
                {DECOR_POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {POSITION_LABELS[position]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink">
              Size
              <select
                name="decorSize"
                value={row.size}
                onChange={(event) => updateRow(index, { size: event.target.value as DecorSize })}
                className="input w-auto"
              >
                {DECOR_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {SIZE_LABELS[size]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
              className="text-xs font-medium text-terracotta hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setRows((prev) => [
              ...prev,
              { existingUrl: "", previewUrl: "", position: "top-left", size: "md" },
            ])
          }
          className="self-start text-xs font-medium text-aegean hover:underline"
        >
          + Add artwork
        </button>
      </div>

      {state?.message && state.message !== "Style updated." && (
        <p className="text-sm text-terracotta">{state.message}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save style"}
        </button>
        <button type="button" onClick={onDone} className="text-sm text-foreground/60 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
