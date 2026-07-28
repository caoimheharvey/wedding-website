"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CONTACT_INFO_SUCCESS_MESSAGE,
  guestNeedsLastName,
  type ContactInfoEntry,
} from "@/lib/guests/contact-info";
import { submitContactInfo } from "@/lib/guests/guest-actions";
import type { Guest, PreferredLanguage } from "@/lib/guests/types";
import { contactEditableGuests } from "@/lib/guest-site/contact-editable-guests";
import type { RsvpDelegatePair } from "@/lib/guests/rsvp-delegates";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import { defaultPhoneCountryId } from "@/lib/phone/countries";
import { formatStoredPhoneForCountry, parseStoredPhone } from "@/lib/phone/format";
import { PhoneInput } from "./phone-input";

import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";

interface ContactFields {
  lastName: string;
  email: string;
  phoneCountryId: string;
  phoneNational: string;
}

function fieldsFromGuest(guest: Guest, language: PreferredLanguage): ContactFields {
  const parsed = parseStoredPhone(guest.phone, defaultPhoneCountryId(language));
  return {
    lastName: guest.lastName ?? "",
    email: guest.email ?? "",
    phoneCountryId: parsed.countryId,
    phoneNational: parsed.national,
  };
}

export function ContactInfoForm({
  guest,
  allGuests,
  delegatePairs,
  language,
  previewGuestId,
  title,
  onboarding = false,
}: {
  guest: Guest;
  allGuests: Guest[];
  delegatePairs: RsvpDelegatePair[];
  language: PreferredLanguage;
  previewGuestId?: string;
  title?: string | null;
  /** When true, only collects this guest's details before they can view the site. */
  onboarding?: boolean;
}) {
  const strings = onboarding
    ? GUEST_SITE_STRINGS[language].contactOnboarding
    : GUEST_SITE_STRINGS[language].contactInfoForm;
  const people = useMemo(() => {
    if (onboarding) return [guest];
    return contactEditableGuests(guest, allGuests, delegatePairs);
  }, [onboarding, guest, allGuests, delegatePairs]);

  const peopleSignature = `${language}::${people
    .map((person) => `${person.id}:${person.lastName ?? ""}:${person.email ?? ""}:${person.phone ?? ""}`)
    .join("|")}`;
  const [fieldsByGuestId, setFieldsByGuestId] = useState<Record<string, ContactFields>>(() =>
    Object.fromEntries(people.map((person) => [person.id, fieldsFromGuest(person, language)])),
  );

  // Adjust state during render (React's recommended alternative to an
  // effect here) rather than after commit, avoiding an extra render tick.
  const [handledSignature, setHandledSignature] = useState(peopleSignature);
  if (peopleSignature !== handledSignature) {
    setHandledSignature(peopleSignature);
    setFieldsByGuestId(
      Object.fromEntries(people.map((person) => [person.id, fieldsFromGuest(person, language)])),
    );
  }
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const showLinkedNote = !onboarding && people.length > 1;

  if (!onboarding && people.length === 0) return null;

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
        lastName: guestNeedsLastName(person)
          ? (fieldsByGuestId[person.id]?.lastName ?? "")
          : (person.lastName ?? ""),
        email: fieldsByGuestId[person.id]?.email ?? "",
        phoneCountryId: fieldsByGuestId[person.id]?.phoneCountryId ?? defaultPhoneCountryId(language),
        phoneNational: fieldsByGuestId[person.id]?.phoneNational ?? "",
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
      className="w-full rounded-lg border border-border bg-surface p-4 text-center"
    >
      <div className="mb-4">
        <h2 className="mb-1 font-display text-lg text-ink">{title || strings.heading}</h2>
        <p className="text-sm text-foreground/60">{strings.description}</p>
        {showLinkedNote && (
          <p className="mt-3 text-xs text-foreground/50">
            {GUEST_SITE_STRINGS[language].contactInfoForm.linkedGuestsNote}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {people.map((person) => (
          <div
            key={person.id}
            className="flex flex-col gap-3 border-t border-border/60 pt-4 first:border-t-0 first:pt-0"
          >
            <p className="text-sm font-medium text-ink">{guestDisplayName(person)}</p>
            {guestNeedsLastName(person) && (
              <input
                type="text"
                value={fieldsByGuestId[person.id]?.lastName ?? ""}
                onChange={(event) => updateField(person.id, "lastName", event.target.value)}
                placeholder={strings.lastNamePlaceholder}
                className="input text-center"
              />
            )}
            <input
              type="email"
              value={fieldsByGuestId[person.id]?.email ?? ""}
              onChange={(event) => updateField(person.id, "email", event.target.value)}
              placeholder={strings.emailPlaceholder}
              className="input text-center"
            />
            <PhoneInput
              countryId={fieldsByGuestId[person.id]?.phoneCountryId ?? defaultPhoneCountryId(language)}
              national={fieldsByGuestId[person.id]?.phoneNational ?? ""}
              onCountryChange={(phoneCountryId) =>
                updateField(person.id, "phoneCountryId", phoneCountryId)
              }
              onNationalChange={(phoneNational) =>
                updateField(person.id, "phoneNational", phoneNational)
              }
              placeholder={strings.phonePlaceholder}
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
