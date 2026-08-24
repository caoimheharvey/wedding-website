"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createEmbedGroupSection,
  updateEmbedGroupSection,
  type GuestViewSectionActionState,
} from "@/lib/guest-view/actions";
import { WEDDING_PARTY_ROLE_LABELS, WEDDING_PARTY_ROLES } from "@/lib/guests/types";
import type { EmbedProvider, GuestViewSection } from "@/lib/guest-view/types";

const initialState: GuestViewSectionActionState = undefined;

const PROVIDER_LABELS: Record<EmbedProvider, string> = {
  google_maps: "Google Maps",
  pinterest: "Pinterest",
  other: "Other embed",
};

interface EmbedRow {
  provider: EmbedProvider;
  url: string;
  caption: string;
  columnIndex: number;
}

export function EmbedGroupForm({
  section,
  onDone,
}: {
  section?: GuestViewSection;
  onDone?: () => void;
}) {
  const action = section ? updateEmbedGroupSection.bind(null, section.id) : createEmbedGroupSection;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.message === "Section added." || state?.message === "Section updated.") {
      onDone?.();
    }
  }, [state, onDone]);

  const [columnCount, setColumnCount] = useState(section?.columnCount ?? 2);

  const [rows, setRows] = useState<EmbedRow[]>(
    section && section.embeds.length > 0
      ? section.embeds.map((embed) => ({
          provider: embed.provider,
          url: embed.url,
          caption: embed.caption ?? "",
          columnIndex: embed.columnIndex,
        }))
      : [{ provider: "google_maps", url: "", caption: "", columnIndex: 0 }],
  );

  function updateRow(index: number, patch: Partial<EmbedRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 glass-card p-4"
    >
      <label className="flex flex-col gap-1 text-sm text-ink">
        Section title (optional)
        <input
          name="title"
          defaultValue={section?.titles.en ?? ""}
          className="input"
          placeholder="e.g. Venue &amp; travel"
        />
      </label>

      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm text-ink">Visible to</legend>
        <div className="flex flex-wrap gap-3">
          {WEDDING_PARTY_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-1 text-xs text-ink">
              <input
                type="checkbox"
                name="visibleToRoles"
                value={role}
                defaultChecked={section?.visibleToRoles.includes(role)}
                className="h-3.5 w-3.5 rounded border-border text-aegean focus:ring-aegean"
              />
              {WEDDING_PARTY_ROLE_LABELS[role]}
            </label>
          ))}
        </div>
        <span className="text-xs text-foreground/50">Leave all unchecked to show everyone.</span>
      </fieldset>

      <label className="flex flex-col gap-1 text-sm text-ink">
        Columns
        <select
          name="columnCount"
          value={columnCount}
          onChange={(event) => setColumnCount(Number(event.target.value))}
          className="input w-auto"
        >
          {[1, 2, 3, 4].map((count) => (
            <option key={count} value={count}>
              {count}
            </option>
          ))}
        </select>
        <span className="text-xs font-normal text-foreground/50">
          {columnCount > 1 ? "Choose which column each embed appears in." : "Single column layout."}
        </span>
      </label>

      <div className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex flex-wrap items-end gap-2 rounded-md border border-border p-2"
          >
            <label className="flex flex-col gap-1 text-xs text-ink">
              Provider
              <select
                name="embedProvider"
                value={row.provider}
                onChange={(event) =>
                  updateRow(index, { provider: event.target.value as EmbedProvider })
                }
                className="input w-auto"
              >
                {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-ink">
              Embed URL
              <input
                name="embedUrl"
                value={row.url}
                onChange={(event) => updateRow(index, { url: event.target.value })}
                className="input"
                placeholder="https://… or paste the embed/iframe HTML"
              />
              <span className="font-normal text-foreground/50">
                A link works, or paste the whole &quot;embed&quot;/&quot;iframe&quot; HTML snippet
                the site gives you — either is fine.
                {row.provider === "google_maps" &&
                  " For a plain link, use a regular Google Maps link (a place page, or a pinned location) — not a shortened maps.app.goo.gl link, those can't be embedded."}
              </span>
              {row.provider === "pinterest" && (
                <span className="font-normal text-foreground/50">
                  For a plain link, use the board&apos;s URL (e.g.
                  https://www.pinterest.com/username/board-name/).
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1 text-xs text-ink">
              Caption
              <input
                name="embedCaption"
                value={row.caption}
                onChange={(event) => updateRow(index, { caption: event.target.value })}
                className="input"
                placeholder="Optional"
              />
            </label>
            {columnCount > 1 && (
              <label className="flex flex-col gap-1 text-xs text-ink">
                Column
                <select
                  name="embedColumnIndex"
                  value={row.columnIndex}
                  onChange={(event) =>
                    updateRow(index, { columnIndex: Number(event.target.value) })
                  }
                  className="input w-auto"
                >
                  {Array.from({ length: columnCount }, (_, columnIndex) => (
                    <option key={columnIndex} value={columnIndex}>
                      {columnIndex + 1}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                className="text-xs font-medium text-terracotta hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setRows((prev) => [...prev, { provider: "google_maps", url: "", caption: "", columnIndex: 0 }])
          }
          className="self-start text-xs font-medium text-aegean hover:underline"
        >
          + Add embed
        </button>
      </div>

      {state?.message && <p className="text-sm text-terracotta">{state.message}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : section ? "Save changes" : "Add section"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-foreground/60 hover:underline"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
