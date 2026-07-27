"use client";

import { useState, useTransition } from "react";
import { deleteGuest } from "@/lib/guests/actions";

export function DeleteGuestButton({
  guestId,
  guestName,
  linkedPlusOneCount,
}: {
  guestId: string;
  guestName: string;
  linkedPlusOneCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleDelete() {
    const warning =
      linkedPlusOneCount > 0
        ? `${guestName} has ${linkedPlusOneCount} linked plus-one(s), who will be unlinked (not deleted). Delete ${guestName}?`
        : `Delete ${guestName}? This cannot be undone.`;

    if (!window.confirm(warning)) return;

    startTransition(async () => {
      const result = await deleteGuest(guestId);
      setMessage(result.message ?? null);
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm font-medium text-terracotta hover:underline disabled:opacity-50"
      >
        {isPending ? "Deleting…" : "Delete"}
      </button>
      {message && <p className="text-xs text-foreground/60">{message}</p>}
    </div>
  );
}
