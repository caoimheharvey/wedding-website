"use client";

import { useActionState, useTransition } from "react";
import {
  deleteVenueDocument,
  uploadVenueDocument,
  type VenueDetailsActionState,
} from "@/lib/venues/actions";
import type { VenueDocument } from "@/lib/venues/types";

const initialState: VenueDetailsActionState = undefined;

export function VenueDocuments({
  vendorId,
  category,
  documents,
}: {
  vendorId: string;
  category: string;
  documents: VenueDocument[];
}) {
  const action = uploadVenueDocument.bind(null, vendorId, category);
  const [state, formAction, isUploading] = useActionState(action, initialState);
  const [isDeleting, startDelete] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-xl text-ink">Documents</h2>
        <p className="text-sm text-foreground/60">
          Attachments from the venue — price lists, caterer lists, contracts. Up to 10MB each.
        </p>
      </div>

      {documents.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 py-1.5 text-sm"
            >
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                download={doc.fileName}
                className="min-w-0 truncate text-aegean hover:underline"
              >
                {doc.fileName}
              </a>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  if (!window.confirm(`Delete "${doc.fileName}"?`)) return;
                  startDelete(async () => {
                    await deleteVenueDocument(doc.id, vendorId, category);
                  });
                }}
                className="shrink-0 text-xs font-medium text-terracotta hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input type="file" name="document" required className="input w-auto" />
        <button
          type="submit"
          disabled={isUploading}
          className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isUploading ? "Uploading…" : "Upload"}
        </button>
      </form>
      {state?.message && <p className="text-sm text-foreground/60">{state.message}</p>}
    </div>
  );
}
