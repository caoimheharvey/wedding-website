import Link from "next/link";
import { PREFERRED_LANGUAGE_LABELS, type PreferredLanguage } from "@/lib/guests/types";

export const LANGUAGE_CODES = Object.keys(PREFERRED_LANGUAGE_LABELS) as PreferredLanguage[];

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
          {code.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
