import Link from "next/link";
import { redirect } from "next/navigation";
import type { PreferredLanguage } from "@/lib/guests/types";
import { getGuestById, listGuests } from "@/lib/guests/queries";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus } from "@/lib/rsvp/status";
import { isLocalTestMode } from "@/lib/local-test";
import { getGuestSession } from "@/lib/guest-auth/session";
import { signOutGuest } from "@/lib/guest-auth/actions";
import { getPreviewPersona } from "@/lib/guest-site/preview-personas";
import { listGuestViewSections, visibleSectionsFor } from "@/lib/guest-view/queries";
import { GuestSiteView } from "./guest/_components/guest-site-view";
import { GuestViewSections } from "./guest/_components/guest-view-sections";
import { LanguageTabs, isPreferredLanguage } from "./guest/_components/language-tabs";

function AdminViewLink() {
  return (
    <div className="flex w-full justify-end">
      <Link
        href="/admin"
        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground/50 transition hover:border-aegean hover:text-aegean"
      >
        Admin View
      </Link>
    </div>
  );
}

export default async function Home({
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
          <AdminViewLink />

          <form action={signOutGuest} className="flex w-full justify-end">
            <button
              type="submit"
              className="text-xs font-medium text-foreground/40 hover:text-aegean"
            >
              Sign out
            </button>
          </form>

          <LanguageTabs currentLanguage={language} hrefFor={(code) => `/?lang=${code}`} />

          <GuestSiteView
            firstName={guest.firstName}
            language={language}
            effectiveStatus={effectiveStatus}
            effectiveDeadline={effectiveDeadline}
          />

          <GuestViewSections
            sections={sections}
            language={language}
            rsvp={{
              guest,
              delegateFor,
              deadlinePassed: effectiveStatus === "deadline_missed",
              delegateName: delegateHolder
                ? `${delegateHolder.firstName} ${delegateHolder.lastName}`
                : undefined,
            }}
          />
        </main>
      );
    }
  }

  if (!isLocalTestMode()) {
    redirect("/guest/sign-in");
  }

  // Local test mode, no session: this route only renders a preview when
  // linked to with role/lang query params — the picker UI for choosing
  // those lives in the admin Guest View tab, not here.
  const language: PreferredLanguage = isPreferredLanguage(lang) ? lang : "en";
  const persona = role ? getPreviewPersona(role) : null;
  const [siteSettings, allSections] = await Promise.all([
    getSiteSettings(),
    listGuestViewSections(),
  ]);
  const sections = persona ? visibleSectionsFor(allSections, persona.partyRoles) : [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center gap-6 px-6 py-12 text-center">
      <AdminViewLink />

      <div className="w-full rounded-lg bg-terracotta px-4 py-2 text-center text-xs font-medium text-whitewash">
        Local test mode. Real guests sign in at{" "}
        <Link href="/guest/sign-in" className="underline">
          /guest/sign-in
        </Link>
        .
      </div>

      {!persona && (
        <>
          <h1 className="font-display text-2xl text-ink">Preview the guest view</h1>
          <p className="text-sm text-foreground/60">
            Pick a role or a specific guest to preview from the{" "}
            <Link href="/admin/guest-view" className="text-aegean underline">
              admin Guest View tab
            </Link>
            .
          </p>
        </>
      )}

      {persona && (
        <>
          <div className="flex w-full items-center justify-between text-xs">
            <Link href="/admin/guest-view" className="text-aegean underline">
              ← Back to admin
            </Link>
            <span className="text-foreground/50">Previewing as {persona.label}</span>
          </div>
          <LanguageTabs
            currentLanguage={language}
            hrefFor={(code) => `/?role=${persona.role}&lang=${code}`}
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
