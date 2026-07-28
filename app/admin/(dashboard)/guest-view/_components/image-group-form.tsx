"use client";

import { useActionState, useEffect, useState } from "react";
import {
  createImageGroupSection,
  updateImageGroupSection,
  type GuestViewSectionActionState,
} from "@/lib/guest-view/actions";
import { WEDDING_PARTY_ROLE_LABELS, WEDDING_PARTY_ROLES } from "@/lib/guests/types";
import type { GuestViewSection } from "@/lib/guest-view/types";

const initialState: GuestViewSectionActionState = undefined;

interface ImageRow {
  file: File | null;
  existingUrl: string;
  caption: string;
  previewUrl: string;
  columnIndex: number;
}

function emptyRow(): ImageRow {
  return { file: null, existingUrl: "", caption: "", previewUrl: "", columnIndex: 0 };
}

export function ImageGroupForm({
  section,
  onDone,
}: {
  section?: GuestViewSection;
  onDone?: () => void;
}) {
  const action = section ? updateImageGroupSection.bind(null, section.id) : createImageGroupSection;
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    if (state?.message === "Section added." || state?.message === "Section updated.") {
      onDone?.();
    }
  }, [state, onDone]);

  const [columnCount, setColumnCount] = useState(section?.columnCount ?? 2);

  const [rows, setRows] = useState<ImageRow[]>(
    section && section.images.length > 0
      ? section.images.map((image) => ({
          file: null,
          existingUrl: image.url,
          caption: image.caption ?? "",
          previewUrl: image.url,
          columnIndex: image.columnIndex,
        }))
      : [emptyRow()],
  );

  function updateRow(index: number, patch: Partial<ImageRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleFileChange(index: number, file: File | null) {
    updateRow(index, { file, previewUrl: file ? URL.createObjectURL(file) : rows[index].existingUrl });
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
    >
      <label className="flex flex-col gap-1 text-sm text-ink">
        Section title (optional)
        <input
          name="title"
          defaultValue={section?.titles.en ?? ""}
          className="input"
          placeholder="e.g. Engagement photos"
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
          {columnCount > 1 ? "Choose which column each image appears in." : "Single column layout."}
        </span>
      </label>

      <div className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2"
          >
            {row.previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- previews cover arbitrary uploaded/hosted images, not a known-optimizable set
              <img
                src={row.previewUrl}
                alt=""
                className="h-16 w-16 rounded-md border border-border object-cover"
              />
            )}
            <input type="hidden" name="imageExistingUrl" value={row.existingUrl} />
            <label className="flex flex-col gap-1 text-xs text-ink">
              {row.existingUrl ? "Replace image" : "Image"}
              <input
                type="file"
                name="imageFile"
                accept="image/*"
                onChange={(event) => handleFileChange(index, event.target.files?.[0] ?? null)}
                className="text-xs"
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-xs text-ink">
              Caption
              <input
                name="imageCaption"
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
                  name="imageColumnIndex"
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
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
          className="self-start text-xs font-medium text-aegean hover:underline"
        >
          + Add image
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
