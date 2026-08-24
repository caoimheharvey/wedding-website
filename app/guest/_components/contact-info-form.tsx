"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  CONTACT_INFO_SUCCESS_MESSAGE,
  guestContactIsComplete,
  guestNeedsFirstName,
  guestNeedsLastName,
  type ContactInfoEntry,
} from "@/lib/guests/contact-info";
import { submitContactInfo } from "@/lib/guests/guest-actions";
import { PREFERRED_LANGUAGE_LABELS, type Guest, type PreferredLanguage } from "@/lib/guests/types";
import { contactEditableGuests } from "@/lib/guest-site/contact-editable-guests";
import type { RsvpDelegatePair } from "@/lib/guests/rsvp-delegates";
import { guestDisplayName } from "@/lib/guest-site/party-names";
import { defaultPhoneCountryId } from "@/lib/phone/countries";
import { formatStoredPhoneForCountry, parseStoredPhone } from "@/lib/phone/format";
import { PhoneInput } from "./phone-input";

import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";

interface ContactFields {
  firstName: string;
  lastName: string;
  preferredLanguage: PreferredLanguage;
  email: string;
  phoneCountryId: string;
  phoneNational: string;
}

function fieldsFromGuest(guest: Guest, language: PreferredLanguage): ContactFields {
  const parsed = parseStoredPhone(guest.phone, defaultPhoneCountryId(language));
  return {
    firstName: guest.firstName ?? "",
    lastName: guest.lastName ?? "",
    // Guests filling in their name for the first time are most often the
    // WeChat sign-in flow, so default the language choice to Mandarin
    // rather than whatever placeholder value the guest record was created
    // with.
    preferredLanguage: guestNeedsFirstName(guest) ? "zh" : guest.preferredLanguage,
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
    // Include the signed-in guest themselves, not just their linked plus-ones
    // and delegatees — they may still need to add/fix their own details even
    // if they didn't just do so while logging in.
    return [guest, ...contactEditableGuests(guest, allGuests, delegatePairs)];
  }, [onboarding, guest, allGuests, delegatePairs]);

  const peopleSignature = `${language}::${people
    .map(
      (person) =>
        `${person.id}:${person.firstName ?? ""}:${person.lastName ?? ""}:${person.preferredLanguage}:${person.email ?? ""}:${person.phone ?? ""}`,
    )
    .join("|")}`;
  const [fieldsByGuestId, setFieldsByGuestId] = useState<Record<string, ContactFields>>(() =>
    Object.fromEntries(people.map((person) => [person.id, fieldsFromGuest(person, language)])),
  );
  const [editingGuestIds, setEditingGuestIds] = useState<Set<string>>(
    () => new Set(people.filter((person) => !guestContactIsComplete(person)).map((person) => person.id)),
  );

  // Adjust state during render (React's recommended alternative to an
  // effect here) rather than after commit, avoiding an extra render tick.
  const [handledSignature, setHandledSignature] = useState(peopleSignature);
  if (peopleSignature !== handledSignature) {
    setHandledSignature(peopleSignature);
    setFieldsByGuestId(
      Object.fromEntries(people.map((person) => [person.id, fieldsFromGuest(person, language)])),
    );
    setEditingGuestIds(
      new Set(people.filter((person) => !guestContactIsComplete(person)).map((person) => person.id)),
    );
  }
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const showLinkedNote = !onboarding && people.length > 1;

  function updateField(guestId: string, key: keyof ContactFields, value: string) {
    setFieldsByGuestId((current) => ({
      ...current,
      [guestId]: { ...current[guestId], [key]: value },
    }));
  }

  function startEditing(guestId: string) {
    setEditingGuestIds((current) => new Set(current).add(guestId));
  }

  function stopEditing(guestId: string) {
    setEditingGuestIds((current) => {
      const next = new Set(current);
      next.delete(guestId);
      return next;
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const entries: ContactInfoEntry[] = people.map((person) => ({
        guestId: person.id,
        firstName: guestNeedsFirstName(person)
          ? (fieldsByGuestId[person.id]?.firstName ?? "")
          : (person.firstName ?? ""),
        lastName: guestNeedsLastName(person)
          ? (fieldsByGuestId[person.id]?.lastName ?? "")
          : (person.lastName ?? ""),
        preferredLanguage: guestNeedsFirstName(person)
          ? (fieldsByGuestId[person.id]?.preferredLanguage ?? "zh")
          : person.preferredLanguage,
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
      className="glass-card w-full p-4 text-center"
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
        {people.map((person) => {
          const isEditing = editingGuestIds.has(person.id);
          const wasComplete = guestContactIsComplete(person);

          return (
            <div
              key={person.id}
              className="flex flex-col gap-3 border-t border-border/60 pt-4 first:border-t-0 first:pt-0"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-ink">
                  {guestDisplayName(person) || "Your details"}
                </p>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEditing(person.id)}
                    className="text-xs text-aegean hover:underline"
                  >
                    {strings.edit}
                  </button>
                )}
              </div>

              {isEditing ? (
                <>
                  {guestNeedsFirstName(person) && (
                    <input
                      type="text"
                      value={fieldsByGuestId[person.id]?.firstName ?? ""}
                      onChange={(event) => updateField(person.id, "firstName", event.target.value)}
                      placeholder={strings.firstNamePlaceholder}
                      className="glass-input text-center"
                    />
                  )}
                  {guestNeedsLastName(person) && (
                    <input
                      type="text"
                      value={fieldsByGuestId[person.id]?.lastName ?? ""}
                      onChange={(event) => updateField(person.id, "lastName", event.target.value)}
                      placeholder={strings.lastNamePlaceholder}
                      className="glass-input text-center"
                    />
                  )}
                  {guestNeedsFirstName(person) && (
                    <label className="flex flex-col gap-1 text-left text-xs text-foreground/60">
                      {strings.preferredLanguageLabel}
                      <select
                        value={fieldsByGuestId[person.id]?.preferredLanguage ?? "zh"}
                        onChange={(event) =>
                          updateField(person.id, "preferredLanguage", event.target.value)
                        }
                        className="glass-input"
                      >
                        {Object.entries(PREFERRED_LANGUAGE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <input
                    type="email"
                    value={fieldsByGuestId[person.id]?.email ?? ""}
                    onChange={(event) => updateField(person.id, "email", event.target.value)}
                    placeholder={strings.emailPlaceholder}
                    className="glass-input text-center"
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
                  {wasComplete && (
                    <button
                      type="button"
                      onClick={() => stopEditing(person.id)}
                      className="self-center text-xs text-foreground/50 hover:underline"
                    >
                      {strings.cancel}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-1 text-sm text-foreground/70">
                  {person.email && <span>{person.email}</span>}
                  {person.phone && <span>{person.phone}</span>}
                </div>
              )}
            </div>
          );
        })}
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
