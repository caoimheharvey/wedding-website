export interface SiteSettings {
  /** ISO date (YYYY-MM-DD). Site-wide RSVP cutoff, unless a guest has rsvpDeadlineOverride set. */
  defaultRsvpDeadline: string | null;
}
