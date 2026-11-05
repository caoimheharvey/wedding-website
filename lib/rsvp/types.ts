export interface SiteSettings {
  /** ISO date (YYYY-MM-DD). Site-wide RSVP cutoff, unless a guest has rsvpDeadlineOverride set. */
  defaultRsvpDeadline: string | null;
  /** ISO date (YYYY-MM-DD). The wedding day — used for countdown and planning phases. */
  weddingDate: string | null;
  /** City shown on the guest site and calendar download. */
  weddingLocation: string | null;
  /** Venue name shown above the city, optionally linked to the venue's website. */
  weddingVenue: string | null;
  weddingVenueUrl: string | null;
  /** Translucent backdrop shown behind the guest-facing site. Null falls back to a decorative pattern. */
  backgroundImageUrl: string | null;
  /** Designed header image (e.g. from Canva) that replaces the label and names at the top of the guest site. */
  heroImageUrl: string | null;
  /** The public Canva-designed website; guest pages link back to it. */
  websiteUrl: string | null;
  /** Overrides the guest site's top header label (e.g. "Save the Date"). Null uses the automatic phase-based label. */
  headerLabel: string | null;
  /** French / Mandarin versions of the header label override. */
  headerLabelFr: string | null;
  headerLabelZh: string | null;
  /** The region the wedding is in (e.g. "Andalucía (Sevilla / Cádiz area)"), shown on Overview. */
  destination: string | null;
}
