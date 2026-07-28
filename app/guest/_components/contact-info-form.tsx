"use client";

import { useState, useTransition, type FormEvent } from "react";
import { submitContactInfo } from "@/lib/guests/guest-actions";
import type { Guest, PreferredLanguage } from "@/lib/guests/types";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";

export function ContactInfoForm({
  guest,
  language,
  previewGuestId,
  title,
}: {
  guest: Guest;
  language: PreferredLanguage;
  /** Local-test-only: lets the admin preview route submit without a real session. */
  previewGuestId?: string;
  /** Overrides the default heading — set from the Guest View section's title. */
  title?: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language].contactInfoForm;
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Only for guests we have neither an email nor phone for — this isn't a
  // general-purpose contact editor, just a one-time gap-filler.
  if (guest.email || guest.phone || done) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await submitContactInfo(email, phone, previewGuestId);
      setMessage(result.message ?? null);
      if (result.message === "Thanks — we'll keep you posted!") setDone(true);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full rounded-lg border border-border bg-surface p-4 text-left"
    >
      <h2 className="mb-1 font-display text-lg text-ink">{title || strings.heading}</h2>
      <p className="mb-3 text-sm text-foreground/60">{strings.description}</p>
      <div className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={strings.emailPlaceholder}
          className="input"
        />
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={strings.phonePlaceholder}
          className="input"
        />
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
