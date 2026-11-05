import "server-only";
import type { SiteSettings } from "./types";

/**
 * In-memory site settings used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 */
let settings: SiteSettings = {
  defaultRsvpDeadline: "2027-04-01",
  weddingDate: "2028-07-15",
  weddingLocation: null,
  weddingVenue: null,
  weddingVenueUrl: null,
  backgroundImageUrl: null,
  heroImageUrl: null,
  websiteUrl: null,
  headerLabel: null,
  headerLabelFr: null,
  headerLabelZh: null,
  destination: "Andalucía (Sevilla / Cádiz area)",
};

export function mockGetSiteSettings(): SiteSettings {
  return settings;
}

export function mockUpdateDefaultRsvpDeadline(deadline: string | null): SiteSettings {
  settings = { ...settings, defaultRsvpDeadline: deadline };
  return settings;
}

export function mockUpdateWeddingDate(date: string | null): SiteSettings {
  settings = { ...settings, weddingDate: date };
  return settings;
}

export function mockUpdateWeddingLocation(location: string | null): SiteSettings {
  settings = { ...settings, weddingLocation: location };
  return settings;
}

export function mockUpdateWeddingVenue(venue: string | null, venueUrl: string | null): SiteSettings {
  settings = { ...settings, weddingVenue: venue, weddingVenueUrl: venueUrl };
  return settings;
}

export function mockUpdateBackgroundImage(url: string | null): SiteSettings {
  settings = { ...settings, backgroundImageUrl: url };
  return settings;
}

export function mockUpdateHeroImage(url: string | null): SiteSettings {
  settings = { ...settings, heroImageUrl: url };
  return settings;
}

export function mockUpdateWebsiteUrl(url: string | null): SiteSettings {
  settings = { ...settings, websiteUrl: url };
  return settings;
}

export function mockUpdateHeaderLabel(
  label: string | null,
  fr: string | null,
  zh: string | null,
): SiteSettings {
  settings = { ...settings, headerLabel: label, headerLabelFr: fr, headerLabelZh: zh };
  return settings;
}

export function mockUpdateDestination(destination: string | null): SiteSettings {
  settings = { ...settings, destination };
  return settings;
}
