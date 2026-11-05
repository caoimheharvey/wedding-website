import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockGetSiteSettings } from "./mock-store";
import type { SiteSettings } from "./types";

export async function getSiteSettings(): Promise<SiteSettings> {
  if (isLocalTestMode()) return mockGetSiteSettings();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("site_settings")
    .select("default_rsvp_deadline, wedding_date, wedding_location, wedding_venue, wedding_venue_url, background_image_url, hero_image_url, website_url, header_label, header_label_fr, header_label_zh, destination")
    .eq("id", 1)
    .single();

  if (error) throw new Error(`Failed to load site settings: ${error.message}`);
  return {
    defaultRsvpDeadline: data.default_rsvp_deadline,
    weddingDate: data.wedding_date,
    weddingLocation: data.wedding_location,
    weddingVenue: data.wedding_venue,
    weddingVenueUrl: data.wedding_venue_url,
    backgroundImageUrl: data.background_image_url,
    heroImageUrl: data.hero_image_url,
    websiteUrl: data.website_url,
    headerLabel: data.header_label,
    headerLabelFr: data.header_label_fr,
    headerLabelZh: data.header_label_zh,
    destination: data.destination,
  };
}
