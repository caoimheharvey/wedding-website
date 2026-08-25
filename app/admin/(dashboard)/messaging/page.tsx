import { listGuests } from "@/lib/guests/queries";
import { listCampaigns } from "@/lib/messaging/queries";
import { getSiteSettings } from "@/lib/rsvp/queries";
import { getEffectiveRsvpStatus, type EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { ComposeMessageForm } from "./_components/compose-message-form";
import { MessageHistory } from "./_components/message-history";

export default async function MessagingPage() {
  const [guests, siteSettings, campaigns] = await Promise.all([
    listGuests(),
    getSiteSettings(),
    listCampaigns(),
  ]);

  const effectiveStatusById: Record<string, EffectiveRsvpStatus> = {};
  for (const guest of guests) {
    effectiveStatusById[guest.id] = getEffectiveRsvpStatus(
      guest.rsvpStatus,
      guest.rsvpDeadlineOverride ?? siteSettings.defaultRsvpDeadline,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink">Messaging</h1>
        <p className="text-sm text-foreground/60">
          Compose an email, pick who receives it, and keep a record of what&apos;s been sent.
        </p>
      </div>

      <ComposeMessageForm guests={guests} effectiveStatusById={effectiveStatusById} />

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-lg text-ink">History</h2>
        <MessageHistory campaigns={campaigns} />
      </div>
    </div>
  );
}
