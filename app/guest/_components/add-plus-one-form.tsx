"use client";

import { useActionState } from "react";
import { addPlusOne } from "@/lib/guests/guest-actions";
import { PLUS_ONE_SUCCESS_MESSAGE } from "@/lib/guests/plus-one";
import type { PreferredLanguage } from "@/lib/guests/types";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";

const initialState: { message?: string } | undefined = undefined;

export function AddPlusOneForm({
  language,
  previewGuestId,
  title,
}: {
  language: PreferredLanguage;
  previewGuestId?: string;
  title?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(addPlusOne, initialState);
  const strings = GUEST_SITE_STRINGS[language].addPlusOne;

  if (state?.message === PLUS_ONE_SUCCESS_MESSAGE) {
    return (
      <div className="glass-card w-full p-4 text-center text-sm text-foreground/70">
        {strings.saved}
      </div>
    );
  }

  return (
    <form action={formAction} className="glass-card w-full p-4 text-center">
      <div className="mb-4">
        <h2 className="mb-1 font-display text-lg text-ink">{title || strings.heading}</h2>
        <p className="text-sm text-foreground/60">{strings.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {previewGuestId && <input type="hidden" name="previewGuestId" value={previewGuestId} />}
        <input
          type="text"
          name="firstName"
          placeholder={strings.firstNamePlaceholder}
          className="glass-input text-center"
          required
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
        className="mt-4 rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
      >
        {isPending ? "…" : strings.submit}
      </button>
      {state?.message && <p className="mt-2 text-sm text-foreground/70">{state.message}</p>}
    </form>
  );
}
