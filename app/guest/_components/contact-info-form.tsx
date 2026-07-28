"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CONTACT_INFO_SUCCESS_MESSAGE,
  type ContactInfoEntry,
} from "@/lib/guests/contact-info";
import { submitContactInfo } from "@/lib/guests/guest-actions";
import type { Guest, PreferredLanguage } from "@/lib/guests/types";
import { contactEditableGuests } from "@/lib/guest-site/contact-editable-guests";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";

interface ContactFields {
  lastName: string;
  email: string;
  phone: string;
}

function fieldsFromGuest(guest: Guest): ContactFields {
  return {
    lastName: guest.lastName ?? "",
    email: guest.email ?? "",
    phone: guest.phone ?? "",
  };
}

export function ContactInfoForm({
  guest,
  allGuests,
  language,
  previewGuestId,
  title,
}: {
  guest: Guest;
  allGuests: Guest[];
  language: PreferredLanguage;
  previewGuestId?: string;
  title?: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language].contactInfoForm;
  const people = useMemo(
    () => contactEditableGuests(guest, allGuests),
    [guest, allGuests],
  );
  const peopleSignature = people
    .map((person) => `${person.id}:${person.lastName ?? ""}:${person.email ?? ""}:${person.phone ?? ""}`)
    .join("|");
  const [fieldsByGuestId, setFieldsByGuestId] = useState<Record<string, ContactFields>>(() =>
    Object.fromEntries(people.map((person) => [person.id, fieldsFromGuest(person)])),
  );

  useEffect(() => {
    setFieldsByGuestId(
      Object.fromEntries(people.map((person) => [person.id, fieldsFromGuest(person)])),
    );
  }, [peopleSignature, people]);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const showLinkedNote = people.length > 1;

  function updateField(guestId: string, key: keyof ContactFields, value: string) {
    setFieldsByGuestId((current) => ({
      ...current,
      [guestId]: { ...current[guestId], [key]: value },
    }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const entries: ContactInfoEntry[] = people.map((person) => ({
        guestId: person.id,
        lastName: fieldsByGuestId[person.id]?.lastName ?? "",
        email: fieldsByGuestId[person.id]?.email ?? "",
        phone: fieldsByGuestId[person.id]?.phone ?? "",
      }));
      const result = await submitContactInfo(entries, previewGuestId);
      setMessage(result.message ?? null);
      if (result.message === CONTACT_INFO_SUCCESS_MESSAGE) {
        router.refresh();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border border-border bg-surface p-4 text-left"
    >
      <h2 className="mb-1 font-display text-lg text-ink">{title || strings.heading}</h2>
      <p className="mb-3 text-sm text-foreground/60">{strings.description}</p>
      {showLinkedNote && (
        <p className="mb-4 text-xs text-foreground/50">{strings.linkedGuestsNote}</p>
      )}

      <div className="flex flex-col gap-5">
        {people.map((person) => (
          <div
            key={person.id}
            className="flex flex-col gap-3 border-t border-border/60 pt-4 first:border-t-0 first:pt-0"
          >
            <p className="text-sm font-medium text-ink">{guestDisplayName(person)}</p>
            <input
              type="text"
              value={fieldsByGuestId[person.id]?.lastName ?? ""}
              onChange={(event) => updateField(person.id, "lastName", event.target.value)}
              placeholder={strings.lastNamePlaceholder}
              className="input"
            />
            <input
              type="email"
              value={fieldsByGuestId[person.id]?.email ?? ""}
              onChange={(event) => updateField(person.id, "email", event.target.value)}
              placeholder={strings.emailPlaceholder}
              className="input"
            />
            <input
              type="tel"
              value={fieldsByGuestId[person.id]?.phone ?? ""}
              onChange={(event) => updateField(person.id, "phone", event.target.value)}
              placeholder={strings.phonePlaceholder}
              className="input"
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
      {message && <p className="mt-2 text-sm text-foreground/70">{message}</p>}
    </form>
  );
}
