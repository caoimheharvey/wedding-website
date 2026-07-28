import type { PreferredLanguage } from "@/lib/guests/types";
import type { GuestViewSection } from "./types";

/** Picks the section title for the guest's language, falling back to English. */
export function localizedSectionTitle(
  section: Pick<GuestViewSection, "titles">,
  language: PreferredLanguage,
): string | null {
  return section.titles[language] ?? section.titles.en;
}
