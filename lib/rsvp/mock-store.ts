import "server-only";
import type { SiteSettings } from "./types";

/**
 * In-memory site settings used only when LOCAL_TEST_BYPASS_AUTH is set.
 * Resets on every dev server restart — intentional, no persistence needed.
 */
let settings: SiteSettings = { defaultRsvpDeadline: "2027-04-01" };

export function mockGetSiteSettings(): SiteSettings {
  return settings;
}

export function mockUpdateDefaultRsvpDeadline(deadline: string | null): SiteSettings {
  settings = { ...settings, defaultRsvpDeadline: deadline };
  return settings;
}
