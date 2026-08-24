"use client";

import { useActionState, useState, useTransition } from "react";
import { addChild, removeChild } from "@/lib/children/actions";
import type { GuestChild } from "@/lib/children/types";
import type { PreferredLanguage } from "@/lib/guests/types";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";

const initialState: { message?: string } | undefined = undefined;

export function ChildrenForm({
  childrenList,
  language,
  previewGuestId,
  title,
}: {
  childrenList: GuestChild[];
  language: PreferredLanguage;
  previewGuestId?: string;
  title?: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language].children;
  const [state, formAction, isPending] = useActionState(addChild, initialState);
  const [isRemoving, startRemoving] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);

  function handleRemove(childId: string) {
    setRemovingId(childId);
    startRemoving(async () => {
      await removeChild(childId, previewGuestId);
      setRemovingId(null);
    });
  }

  return (
    <div className="glass-card w-full p-4 text-center">
      <div className="mb-4">
        <h2 className="mb-1 font-display text-lg text-ink">{title || strings.heading}</h2>
        <p className="text-sm text-foreground/60">{strings.description}</p>
      </div>

      {childrenList.length > 0 && (
        <ul className="mb-4 flex flex-col gap-2">
          {childrenList.map((child) => (
            <li
              key={child.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-white/50 bg-white/40 px-3 py-2 text-sm text-ink"
            >
              <span>{[child.firstName, child.lastName].filter(Boolean).join(" ")}</span>
              <button
                type="button"
                onClick={() => handleRemove(child.id)}
                disabled={isRemoving && removingId === child.id}
                className="text-xs text-terracotta hover:underline disabled:opacity-50"
              >
                {strings.remove}
              </button>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="flex flex-col gap-3">
        {previewGuestId && <input type="hidden" name="previewGuestId" value={previewGuestId} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="text"
            name="firstName"
            required
            placeholder={strings.firstNamePlaceholder}
            className="glass-input text-center"
          />
          <input
            type="text"
            name="lastName"
            placeholder={strings.lastNamePlaceholder}
            className="glass-input text-center"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="self-center rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "…" : strings.submit}
        </button>
        {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
      </form>
    </div>
  );
}
