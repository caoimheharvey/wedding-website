"use client";

import Link from "next/link";
import {
  buildGoogleCalendarUrl,
  DEFAULT_WEDDING_EVENT_TITLE,
} from "@/lib/calendar/wedding-event";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import { formatWeddingDate, getWeddingCountdown } from "@/lib/planning/countdown";
import type { PreferredLanguage } from "@/lib/guests/types";
import type { SiteSettings } from "@/lib/rsvp/types";

export function CountdownSectionView({
  language,
  weddingDate,
  title,
}: {
  language: PreferredLanguage;
  weddingDate: string | null;
  title: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language].countdownSection;

  if (!weddingDate) {
    return (
      <section className="glass-card p-4 text-center">
        {title ? (
          <h2 className="mb-2 font-display text-lg font-bold text-ink">{title}</h2>
        ) : (
          <h2 className="mb-2 font-display text-lg font-bold text-ink">{strings.heading}</h2>
        )}
        <p className="text-sm text-foreground/60">{strings.unset}</p>
      </section>
    );
  }

  const countdown = getWeddingCountdown(weddingDate);

  return (
    <section className="glass-card p-4 text-center">
      {title ? <h2 className="mb-2 font-display text-lg font-bold text-ink">{title}</h2> : (
        <h2 className="mb-2 font-display text-lg font-bold text-ink">{strings.heading}</h2>
      )}
      {countdown.isPast ? (
        <p className="font-display text-2xl text-ink">{strings.past(countdown.label)}</p>
      ) : countdown.totalDays === 0 ? (
        <p className="font-display text-2xl text-terracotta">{countdown.label}</p>
      ) : (
        <>
          <p className="font-display text-3xl text-ink">{countdown.label}</p>
          <p className="mt-1 text-sm text-foreground/60">
            {strings.daysToGo(countdown.totalDays)}
          </p>
        </>
      )}
    </section>
  );
}

export function WeddingDateSectionView({
  language,
  siteSettings,
  title,
}: {
  language: PreferredLanguage;
  siteSettings: SiteSettings;
  title: string | null;
}) {
  const strings = GUEST_SITE_STRINGS[language].weddingDateSection;
  const { weddingDate, weddingLocation } = siteSettings;

  if (!weddingDate) {
    return (
      <section className="glass-card p-4 text-center">
        {title ? (
          <h2 className="mb-2 font-display text-lg font-bold text-ink">{title}</h2>
        ) : (
          <h2 className="mb-2 font-display text-lg font-bold text-ink">{strings.heading}</h2>
        )}
        <p className="text-sm text-foreground/60">{strings.unset}</p>
      </section>
    );
  }

  const calendarEvent = {
    title: DEFAULT_WEDDING_EVENT_TITLE,
    dateIso: weddingDate,
    location: weddingLocation,
    description: strings.calendarDescription,
  };
  const googleUrl = buildGoogleCalendarUrl(calendarEvent);

  return (
    <section className="glass-card p-4 text-center">
      {title ? <h2 className="mb-2 font-display text-lg font-bold text-ink">{title}</h2> : (
        <h2 className="mb-2 font-display text-lg font-bold text-ink">{strings.heading}</h2>
      )}
      <p className="font-display text-xl text-ink">{formatWeddingDate(weddingDate)}</p>
      {weddingLocation && (
        <p className="mt-1 text-sm text-foreground/60">{weddingLocation}</p>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-aegean px-4 py-1.5 text-sm font-medium text-aegean transition hover:bg-aegean/5"
        >
          {strings.addToGoogle}
        </a>
        <Link
          href="/api/calendar/wedding"
          className="rounded-full bg-aegean px-4 py-1.5 text-sm font-medium text-whitewash transition hover:bg-aegean-dark"
        >
          {strings.downloadIcs}
        </Link>
      </div>
    </section>
  );
}
