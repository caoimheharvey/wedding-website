import { listGuestViewSections } from "@/lib/guest-view/queries";
import { listGuests } from "@/lib/guests/queries";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { sitePhase } from "@/lib/guest-site/phase";
import { GUEST_SITE_STRINGS } from "@/lib/guest-site/i18n";
import { formatWeddingDate } from "@/lib/planning/countdown";
import { WebsiteUrlEditor } from "./_components/website-url-editor";
import { HeroImageEditor } from "./_components/hero-image-editor";
import { BackgroundImageEditor } from "./_components/background-image-editor";
import { GuestViewManager } from "./_components/guest-view-manager";
import { HeaderLabelEditor } from "./_components/header-label-editor";
import { PreviewPicker } from "./_components/preview-picker";

export default async function GuestViewPage() {
  const [sections, guests, siteSettings] = await Promise.all([
    listGuestViewSections(),
    listGuests(),
    getSiteSettings(),
  ]);

  const phase = sitePhase(siteSettings.weddingDate, siteSettings.defaultRsvpDeadline);
  const autoHeaderLabel = GUEST_SITE_STRINGS.en.phaseLabel(
    phase,
    siteSettings.defaultRsvpDeadline ? formatWeddingDate(siteSettings.defaultRsvpDeadline) : null,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Guest View</h1>
        <p className="text-sm text-foreground/60">
          Build the content guests see. Sections show to everyone by default, or restrict one to
          specific wedding party roles — it&apos;ll appear merged into their view, not as a
          separate &quot;extra&quot; page.
        </p>
      </div>

      <section className="glass-card p-4">
        <HeaderLabelEditor
          headerLabel={siteSettings.headerLabel}
          headerLabelFr={siteSettings.headerLabelFr}
          headerLabelZh={siteSettings.headerLabelZh}
          autoLabel={autoHeaderLabel}
        />
      </section>

      <WebsiteUrlEditor websiteUrl={siteSettings.websiteUrl} />
      <HeroImageEditor imageUrl={siteSettings.heroImageUrl} />
      <BackgroundImageEditor imageUrl={siteSettings.backgroundImageUrl} />

      <PreviewPicker guests={guests} />

      <GuestViewManager sections={sections} />
    </div>
  );
}
