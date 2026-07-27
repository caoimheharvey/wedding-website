"use client";

import { useActionState, useState, useTransition } from "react";
import {
  assignGuestToTable,
  deleteSeatingTable,
  unassignGuestFromTable,
  updateSeatingTable,
  type SeatingTableActionState,
} from "@/lib/seating/actions";
import type { SeatingTableWithGuests } from "@/lib/seating/types";
import type { Guest } from "@/lib/guests/types";
import { PriorityBadge } from "../../guests/_components/priority-badge";

const initialState: SeatingTableActionState = undefined;

export function TableCard({
  table,
  unseatedYesGuests,
}: {
  table: SeatingTableWithGuests;
  unseatedYesGuests: Guest[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const updateAction = updateSeatingTable.bind(null, table.id);
  const [state, formAction, isSaving] = useActionState(updateAction, initialState);
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAssign() {
    if (!selectedGuestId) return;
    startTransition(async () => {
      await assignGuestToTable(selectedGuestId, table.id);
      setSelectedGuestId("");
    });
  }

  function handleRemove(guestId: string) {
    startTransition(async () => {
      await unassignGuestFromTable(guestId);
    });
  }

  function handleDelete() {
    if (
      !window.confirm(`Delete "${table.name}"? Assigned guests will be unseated, not deleted.`)
    ) {
      return;
    }
    startTransition(async () => {
      await deleteSeatingTable(table.id);
    });
  }

  if (isEditing) {
    return (
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
      >
        <input
          name="name"
          defaultValue={table.name}
          required
          className="input"
          placeholder="Table name"
        />
        {state?.errors?.name && (
          <span className="text-xs text-terracotta">{state.errors.name[0]}</span>
        )}
        <textarea
          name="description"
          defaultValue={table.description ?? ""}
          rows={2}
          className="input"
          placeholder="Description"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
          >
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="text-sm text-foreground/60 hover:underline"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-ink">{table.name}</h3>
          {table.description && (
            <p className="mt-1 text-sm text-foreground/60">{table.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-foreground/40 hover:text-aegean"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs font-medium text-terracotta hover:underline"
          >
            Delete
          </button>
        </div>
      </div>

      {table.guests.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {table.guests.map((guest) => (
            <li key={guest.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                {guest.firstName} {guest.lastName}
                <PriorityBadge priority={guest.relationshipPriority} />
              </span>
              <button
                type="button"
                onClick={() => handleRemove(guest.id)}
                disabled={isPending}
                className="text-xs font-medium text-terracotta hover:underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-foreground/50">No one seated here yet.</p>
      )}

      {unseatedYesGuests.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <select
            value={selectedGuestId}
            onChange={(event) => setSelectedGuestId(event.target.value)}
            className="input w-auto"
          >
            <option value="">Add a guest…</option>
            {unseatedYesGuests.map((guest) => (
              <option key={guest.id} value={guest.id}>
                {guest.firstName} {guest.lastName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssign}
            disabled={isPending || !selectedGuestId}
            className="rounded-full bg-olive px-3 py-1.5 text-xs font-medium text-whitewash transition disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
