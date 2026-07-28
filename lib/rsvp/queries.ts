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
    .select("default_rsvp_deadline, wedding_date, wedding_location")
    .eq("id", 1)
    .single();

  if (error) throw new Error(`Failed to load site settings: ${error.message}`);
  return {
    defaultRsvpDeadline: data.default_rsvp_deadline,
    weddingDate: data.wedding_date,
    weddingLocation: data.wedding_location,
  };
}
