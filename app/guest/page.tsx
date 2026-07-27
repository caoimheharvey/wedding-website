import Link from "next/link";
import { PREFERRED_LANGUAGE_LABELS, type PreferredLanguage } from "@/lib/guests/types";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { isLocalTestMode } from "@/lib/local-test";
import { PREVIEW_PERSONAS, getPreviewPersona } from "@/lib/guest-site/preview-personas";
import { GuestSiteView } from "./_components/guest-site-view";
import { LanguageTabs, isPreferredLanguage } from "./_components/language-tabs";

export default async function GuestSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; lang?: string }>;
}) {
  if (!isLocalTestMode()) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm tracking-[0.3em] text-aegean uppercase">Guests</p>
        <h1 className="font-display text-4xl text-ink">Caoimhe &amp; Alexandre</h1>
        <p className="max-w-sm text-foreground/70">
          Guest sign-in is coming soon. Check back closer to the wedding.
        </p>
      </main>
    );
  }

  const { role, lang } = await searchParams;
  const language: PreferredLanguage = isPreferredLanguage(lang) ? lang : "en";
  const persona = role ? getPreviewPersona(role) : null;
  const siteSettings = await getSiteSettings();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center gap-6 px-6 py-12 text-center">
      <div className="w-full rounded-lg bg-terracotta px-4 py-2 text-center text-xs font-medium text-whitewash">
        Local test mode — real guest sign-in isn&apos;t built yet
      </div>

      <h1 className="font-display text-2xl text-ink">Preview the guest view</h1>
      <p className="text-sm text-foreground/60">
        Role and language are what determine what a guest is served, so preview by those instead
        of picking one of your guests every time.
      </p>

      <form
        method="get"
        className="flex w-full flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4 text-left"
      >
        <label className="flex flex-col gap-1 text-sm text-ink">
          Role
          <select name="role" defaultValue={role ?? "general"} className="input w-auto">
            {PREVIEW_PERSONAS.map((preview) => (
              <option key={preview.role} value={preview.role}>
                {preview.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink">
          Language
          <select name="lang" defaultValue={language} className="input w-auto">
            {Object.entries(PREFERRED_LANGUAGE_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-full bg-aegean px-4 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark"
        >
          Preview
        </button>
      </form>

      <p className="text-xs text-foreground/50">
        Looking for a specific guest&apos;s exact view? Preview them from the{" "}
        <Link href="/admin/guests" className="underline">
          admin Guests list
        </Link>{" "}
        instead.
      </p>

      {persona && (
        <>
          <LanguageTabs
            currentLanguage={language}
            hrefFor={(code) => `/guest?role=${persona.role}&lang=${code}`}
          />
          <GuestSiteView
            firstName={persona.firstName}
            language={language}
            effectiveStatus={persona.rsvpStatus}
            effectiveDeadline={siteSettings.defaultRsvpDeadline}
            delegateFor={persona.delegateFor}
          />
        </>
      )}
    </main>
  );
}
