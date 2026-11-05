import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import type { PreferredLanguage } from "@/lib/guests/types";
import type { SiteSettings } from "@/lib/rsvp/types";
import { DEFAULT_WEDDING_EVENT_TITLE, type WeddingCalendarEvent } from "./wedding-event";

/** Shown until a venue is chosen and entered as the wedding location on Overview. */
export const DEFAULT_WEDDING_LOCATION = "Seville";

export function effectiveWeddingLocation(settings: Pick<SiteSettings, "weddingLocation">): string {
  return settings.weddingLocation?.trim() || DEFAULT_WEDDING_LOCATION;
}

/** "Venue, City" for the calendar invite; just the city until a venue is set. */
export function calendarLocation(
  settings: Pick<SiteSettings, "weddingLocation" | "weddingVenue">,
): string {
  const city = effectiveWeddingLocation(settings);
  const venue = settings.weddingVenue?.trim();
  return venue ? `${venue}, ${city}` : city;
}

/** The wedding calendar event in a guest's language: venue and city (or Seville), a
 *  description with a link to the public website, and — in the .ics download — three reminders. */
export function buildWeddingCalendarEvent(
  settings: Pick<SiteSettings, "weddingDate" | "weddingLocation" | "weddingVenue" | "websiteUrl">,
  language: PreferredLanguage,
): WeddingCalendarEvent | null {
  if (!settings.weddingDate) return null;
  const strings = GUEST_SITE_STRINGS[language].weddingDateSection;
  const website = settings.websiteUrl?.trim() || null;

  return {
    title: DEFAULT_WEDDING_EVENT_TITLE,
    dateIso: settings.weddingDate,
    location: calendarLocation(settings),
    description: website
      ? `${strings.calendarDescription}\n\n${strings.calendarMoreInfo}: ${website}`
      : strings.calendarDescription,
    url: website,
  };
}
