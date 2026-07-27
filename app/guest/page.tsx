import Link from "next/link";
import { redirect } from "next/navigation";
import { PREFERRED_LANGUAGE_LABELS, type PreferredLanguage } from "@/lib/guests/types";
import { getGuestById, listGuests } from "@/lib/guests/queries";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus } from "@/lib/rsvp/status";
import { isLocalTestMode } from "@/lib/local-test";
import { getGuestSession } from "@/lib/guest-auth/session";
import { signOutGuest } from "@/lib/guest-auth/actions";
import { PREVIEW_PERSONAS, getPreviewPersona } from "@/lib/guest-site/preview-personas";
import { listGuestViewSections, visibleSectionsFor } from "@/lib/guest-view/queries";
import { GuestSiteView } from "./_components/guest-site-view";
import { GuestViewSections } from "./_components/guest-view-sections";
import { RsvpForm } from "./_components/rsvp-form";
import { LanguageTabs, isPreferredLanguage } from "./_components/language-tabs";

export default async function GuestHomePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; lang?: string }>;
}) {
  const { role, lang } = await searchParams;
  const session = await getGuestSession();

  if (session) {
    const guest = await getGuestById(session.guestId);
    if (guest) {
      const [siteSettings, allSections, allGuests] = await Promise.all([
        getSiteSettings(),
        listGuestViewSections(),
        listGuests(),
      ]);

      const language = isPreferredLanguage(lang) ? lang : guest.preferredLanguage;
      const effectiveDeadline = guest.rsvpDeadlineOverride ?? siteSettings.defaultRsvpDeadline;
      const effectiveStatus = getEffectiveRsvpStatus(guest.rsvpStatus, effectiveDeadline);
      const sections = visibleSectionsFor(allSections, guest.partyRoles);
      const delegateFor = allGuests.filter((candidate) => candidate.rsvpDelegateOf === guest.id);
      const delegateHolder = guest.rsvpDelegateOf
        ? allGuests.find((candidate) => candidate.id === guest.rsvpDelegateOf)
        : undefined;

      return (
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center gap-6 px-6 py-12 text-center">
          <form action={signOutGuest} className="flex w-full justify-end">
            <button
              type="submit"
              className="text-xs font-medium text-foreground/40 hover:text-aegean"
            >
              Sign out
            </button>
          </form>

          <LanguageTabs currentLanguage={language} hrefFor={(code) => `/guest?lang=${code}`} />

          <GuestSiteView
            firstName={guest.firstName}
            language={language}
            effectiveStatus={effectiveStatus}
            effectiveDeadline={effectiveDeadline}
          />

          <RsvpForm
            guest={guest}
            delegateFor={delegateFor}
            language={language}
            deadlinePassed={effectiveStatus === "deadline_missed"}
            delegateName={
              delegateHolder ? `${delegateHolder.firstName} ${delegateHolder.lastName}` : undefined
            }
          />

          <GuestViewSections sections={sections} language={language} />
        </main>
      );
    }
  }

  if (!isLocalTestMode()) {
    redirect("/guest/sign-in");
  }

  // Local test mode, no session: keep the role/language persona picker so
  // the couple can quickly check "what does role X see" without needing to
  // complete a real sign-in for every check.
  const language: PreferredLanguage = isPreferredLanguage(lang) ? lang : "en";
  const persona = role ? getPreviewPersona(role) : null;
  const [siteSettings, allSections] = await Promise.all([
    getSiteSettings(),
    listGuestViewSections(),
  ]);
  const sections = persona ? visibleSectionsFor(allSections, persona.partyRoles) : [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center gap-6 px-6 py-12 text-center">
      <div className="w-full rounded-lg bg-terracotta px-4 py-2 text-center text-xs font-medium text-whitewash">
        Local test mode. Real guests sign in at{" "}
        <Link href="/guest/sign-in" className="underline">
          /guest/sign-in
        </Link>
        .
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
          <GuestViewSections sections={sections} language={language} />
        </>
      )}
    </main>
  );
}
