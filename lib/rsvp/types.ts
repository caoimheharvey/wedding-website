export interface SiteSettings {
  /** ISO date (YYYY-MM-DD). Site-wide RSVP cutoff, unless a guest has rsvpDeadlineOverride set. */
  defaultRsvpDeadline: string | null;
  /** ISO date (YYYY-MM-DD). The wedding day — used for countdown and planning phases. */
  weddingDate: string | null;
  /** Venue or city shown on the guest site and calendar download. */
  weddingLocation: string | null;
  /** Translucent backdrop shown behind the guest-facing site. Null falls back to a decorative pattern. */
  backgroundImageUrl: string | null;
  /** Overrides the guest site's top header label (e.g. "Save the Date"). Null uses the automatic phase-based label. */
  headerLabel: string | null;
}
