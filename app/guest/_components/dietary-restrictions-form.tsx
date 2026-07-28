"use client";

import { useActionState, useEffect, useState } from "react";
import { submitDietaryRestrictions } from "@/lib/guests/guest-actions";
import { DIETARY_SUCCESS_MESSAGE } from "@/lib/guests/dietary-info";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import type { Guest, PreferredLanguage } from "@/lib/guests/types";

const initialState: { message?: string } | undefined = undefined;

export function DietaryRestrictionsForm({
  people,
  language,
  previewGuestId,
  title,
}: {
  people: Guest[];
  language: PreferredLanguage;
  previewGuestId?: string;
  title?: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language].dietarySection;
  const [fieldsByGuestId, setFieldsByGuestId] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      people.map((person) => [person.id, person.dietaryRestrictions ?? ""]),
    ),
  );
  const [state, formAction, isPending] = useActionState(submitDietaryRestrictions, initialState);

  useEffect(() => {
    setFieldsByGuestId(
      Object.fromEntries(
        people.map((person) => [person.id, person.dietaryRestrictions ?? ""]),
      ),
    );
  }, [people]);

  return (
    <form
      action={formAction}
      className="w-full rounded-lg border border-border bg-surface p-4 text-center"
    >
      <div className="mb-4">
        <h2 className="mb-1 font-display text-lg text-ink">{title || strings.heading}</h2>
        <p className="text-sm text-foreground/60">{strings.description}</p>
      </div>

      {previewGuestId && (
        <input type="hidden" name="previewGuestId" value={previewGuestId} />
      )}

      <div className="flex flex-col gap-4">
        {people.map((person) => (
          <div key={person.id} className="flex flex-col gap-2 border-t border-border/60 pt-4 first:border-t-0 first:pt-0">
            <p className="text-sm font-medium text-ink">{guestDisplayName(person)}</p>
            <textarea
              name={`dietary_${person.id}`}
              value={fieldsByGuestId[person.id] ?? ""}
              onChange={(event) =>
                setFieldsByGuestId((current) => ({
                  ...current,
                  [person.id]: event.target.value,
                }))
              }
              rows={2}
              placeholder={strings.placeholder}
              className="input resize-y text-center"
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
      >
        {isPending ? "…" : strings.submit}
      </button>
      {state?.message && (
        <p
          className={`mt-2 text-sm ${
            state.message === DIETARY_SUCCESS_MESSAGE ? "text-olive" : "text-terracotta"
          }`}
        >
          {state.message === DIETARY_SUCCESS_MESSAGE ? strings.saved : state.message}
        </p>
      )}
    </form>
  );
}
