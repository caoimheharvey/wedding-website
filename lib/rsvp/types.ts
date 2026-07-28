export interface SiteSettings {
  /** ISO date (YYYY-MM-DD). Site-wide RSVP cutoff, unless a guest has rsvpDeadlineOverride set. */
  defaultRsvpDeadline: string | null;
  /** ISO date (YYYY-MM-DD). The wedding day — used for countdown and planning phases. */
  weddingDate: string | null;
}
