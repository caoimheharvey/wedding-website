import Link from "next/link";
import { PREFERRED_LANGUAGE_LABELS, type PreferredLanguage } from "@/lib/guests/types";

export const LANGUAGE_CODES = Object.keys(PREFERRED_LANGUAGE_LABELS) as PreferredLanguage[];

// Tab labels a guest recognizes at a glance — a language code ("ZH") means
// nothing to someone who reads Chinese, but the script does.
const LANGUAGE_TAB_LABELS: Record<PreferredLanguage, string> = {
  en: "EN",
  fr: "FR",
  zh: "中文",
};

export function isPreferredLanguage(value: string | undefined): value is PreferredLanguage {
  return !!value && (LANGUAGE_CODES as string[]).includes(value);
}

export function LanguageTabs({
  currentLanguage,
  hrefFor,
}: {
  currentLanguage: PreferredLanguage;
  hrefFor: (language: PreferredLanguage) => string;
}) {
  return (
    <nav className="flex gap-3 text-sm">
      {LANGUAGE_CODES.map((code) => (
        <Link
          key={code}
          href={hrefFor(code)}
          className={
            code === currentLanguage
              ? "font-semibold text-aegean underline underline-offset-4"
              : "text-foreground/50 hover:text-aegean"
          }
        >
          {LANGUAGE_TAB_LABELS[code]}
        </Link>
      ))}
    </nav>
  );
}
