import type { PreferredLanguage } from "@/lib/guests/types";

const LABELS: Record<PreferredLanguage, string> = {
  en: "Back to our website",
  fr: "Retour à notre site",
  zh: "返回我们的网站",
};

/** Link from the guest pages back to the public (Canva) site. Renders nothing when unset. */
export function WebsiteLink({
  url,
  language,
}: {
  url: string | null;
  language: PreferredLanguage;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      className="text-xs tracking-[0.2em] text-aegean uppercase hover:underline"
    >
      ← {LABELS[language]}
    </a>
  );
}
