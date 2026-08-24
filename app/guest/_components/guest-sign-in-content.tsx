import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import type { PreferredLanguage } from "@/lib/guests/types";
import { QuickSignInForm } from "../sign-in/_components/quick-sign-in-form";
import { LanguageTabs } from "./language-tabs";

export function GuestSignInContent({ language }: { language: PreferredLanguage }) {
  const strings = GUEST_SITE_STRINGS[language].guestSignIn;

  return (
    <>
      <LanguageTabs currentLanguage={language} hrefFor={(code) => `/?lang=${code}`} />

      <p className="text-sm tracking-[0.3em] text-aegean uppercase">Guests</p>
      <h1 className="font-display text-4xl text-ink">Caoimhe &amp; Alexandre</h1>

      <div className="glass-card w-full p-4 text-left">
        <p className="mb-3 text-sm text-foreground/70">{strings.description}</p>
        <QuickSignInForm language={language} />
      </div>
    </>
  );
}
