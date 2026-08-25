export type SitePhase = "invited" | "save_the_date" | "rsvp" | "countdown";

/**
 * Derived from site settings alone (no per-guest data needed) so it works
 * the same in previews and for signed-in guests. Presence of an RSVP
 * deadline is the strongest signal — once one's set, we've moved past
 * "just announcing" into "actively collecting responses", until that
 * deadline passes.
 */
export function sitePhase(weddingDate: string | null, deadline: string | null): SitePhase {
  if (deadline) {
    const today = new Date().toISOString().slice(0, 10);
    return today > deadline ? "countdown" : "rsvp";
  }
  if (weddingDate) return "save_the_date";
  return "invited";
}
