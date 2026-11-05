import type { PreferredLanguage } from "@/lib/guests/types";
import type { SiteSettings } from "./types";

export function headerLabelsOf(
  settings: Pick<SiteSettings, "headerLabel" | "headerLabelFr" | "headerLabelZh">,
): Record<PreferredLanguage, string | null> {
  return { en: settings.headerLabel, fr: settings.headerLabelFr, zh: settings.headerLabelZh };
}
