"use client";

import { useActionState } from "react";
import { createGuest, updateGuest, type GuestActionState } from "@/lib/guests/actions";
import {
  INVITED_BY_LABELS,
  INVITED_BY_OPTIONS,
  PREFERRED_LANGUAGE_LABELS,
  RELATIONSHIP_PRIORITIES,
  RELATIONSHIP_PRIORITY_LABELS,
  RSVP_STATUS_LABELS,
  RSVP_STATUS_OPTIONS,
  type Guest,
} from "@/lib/guests/types";
import { GuestPicker } from "./guest-picker";
import { GuestDelegatesPicker } from "./guest-delegates-picker";
import { PartyRolesPicker } from "./party-roles-picker";

const initialState: GuestActionState = undefined;

export function GuestForm({
  guest,
  otherGuests,
  defaultRsvpDeadline,
  defaultRsvpDelegateIds = [],
}: {
  guest?: Guest;
  otherGuests: Guest[];
  defaultRsvpDeadline?: string | null;
  defaultRsvpDelegateIds?: string[];
}) {
  const action = guest ? updateGuest.bind(null, guest.id) : createGuest;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" error={state?.errors?.firstName?.[0]}>
          <input
            name="firstName"
            defaultValue={guest?.firstName ?? ""}
            className="input"
            placeholder="Leave blank if using WeChat sign-in below"
          />
        </Field>
        <Field label="Last name (optional)" error={state?.errors?.lastName?.[0]}>
          <input
            name="lastName"
            defaultValue={guest?.lastName ?? ""}
            className="input"
          />
        </Field>
        <Field label="Email" error={state?.errors?.email?.[0]}>
          <input
            type="email"
            name="email"
            defaultValue={guest?.email ?? ""}
            className="input"
          />
        </Field>
        <Field label="Phone" error={state?.errors?.phone?.[0]}>
          <input
            type="tel"
            name="phone"
            defaultValue={guest?.phone ?? ""}
            className="input"
          />
        </Field>
        <Field label="WeChat handle" error={state?.errors?.wechatHandle?.[0]}>
          <input
            name="wechatHandle"
            defaultValue={guest?.wechatHandle ?? ""}
            className="input"
            placeholder="Lets this guest sign in without a name on file yet"
          />
        </Field>
        <Field label="Relationship priority" error={state?.errors?.relationshipPriority?.[0]}>
          <select
            name="relationshipPriority"
            defaultValue={guest?.relationshipPriority ?? ""}
            required
            className="input"
          >
            <option value="" disabled>
              Choose one
            </option>
            {RELATIONSHIP_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}. {RELATIONSHIP_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Preferred language" error={state?.errors?.preferredLanguage?.[0]}>
          <select
            name="preferredLanguage"
            defaultValue={guest?.preferredLanguage ?? "en"}
            required
            className="input"
          >
            {Object.entries(PREFERRED_LANGUAGE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Invited by" error={state?.errors?.invitedBy?.[0]}>
          <select
            name="invitedBy"
            defaultValue={guest?.invitedBy ?? ""}
            required
            className="input"
          >
            <option value="" disabled>
              Choose one
            </option>
            {INVITED_BY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {INVITED_BY_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="RSVP status" error={state?.errors?.rsvpStatus?.[0]}>
          <select
            name="rsvpStatus"
            defaultValue={guest?.rsvpStatus ?? "invited"}
            className="input"
          >
            {RSVP_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {RSVP_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Wedding party roles" error={state?.errors?.partyRoles?.[0]}>
        <PartyRolesPicker defaultRoles={guest?.partyRoles} />
      </Field>

      <Field label="Linked as plus-one of" error={state?.errors?.isPlusOneOf?.[0]}>
        <GuestPicker name="isPlusOneOf" guests={otherGuests} defaultGuestId={guest?.isPlusOneOf} />
      </Field>

      <Field label="RSVP handled by" error={state?.errors?.rsvpDelegateIds?.[0]}>
        <GuestDelegatesPicker
          guests={otherGuests}
          defaultDelegateIds={defaultRsvpDelegateIds}
        />
        <span className="text-xs font-normal text-foreground/50">
          Optional — guests who may submit this person&apos;s RSVP. Plus-one
          links grant delegation automatically. The guest can always log in and
          submit their own RSVP.
        </span>
      </Field>

      <Field label="RSVP deadline override" error={state?.errors?.rsvpDeadlineOverride?.[0]}>
        <input
          type="date"
          name="rsvpDeadlineOverride"
          defaultValue={guest?.rsvpDeadlineOverride ?? ""}
          className="input"
        />
        <span className="text-xs font-normal text-foreground/50">
          Leave blank to use the default
          {defaultRsvpDeadline ? ` (${defaultRsvpDeadline})` : ""}. Only set
          this for a guest who needs a different cutoff.
        </span>
      </Field>

      <Field label="Notes" error={state?.errors?.notes?.[0]}>
        <textarea
          name="notes"
          defaultValue={guest?.notes ?? ""}
          rows={3}
          className="input"
        />
      </Field>

      <Field label="Dietary restrictions" error={state?.errors?.dietaryRestrictions?.[0]}>
        <textarea
          name="dietaryRestrictions"
          defaultValue={guest?.dietaryRestrictions ?? ""}
          rows={2}
          className="input"
          placeholder="Guests can also log this themselves from the guest site"
        />
      </Field>

      {state?.message && (
        <p className="text-sm text-terracotta">{state.message}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : guest ? "Save changes" : "Add guest"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink">
      {label}
      {children}
      {error && <span className="text-xs text-terracotta">{error}</span>}
    </label>
  );
}
