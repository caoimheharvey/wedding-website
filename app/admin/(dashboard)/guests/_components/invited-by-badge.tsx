import { INVITED_BY_LABELS, type InvitedBy } from "@/lib/guests/types";

const BADGE_CLASSES: Record<InvitedBy, string> = {
  alexandre: "bg-aegean-light/15 text-aegean",
  caoimhe: "bg-terracotta/15 text-terracotta",
  joint: "bg-gold/20 text-gold",
};

export function InvitedByBadge({ invitedBy }: { invitedBy: InvitedBy }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${BADGE_CLASSES[invitedBy]}`}
    >
      Invited by {INVITED_BY_LABELS[invitedBy]}
    </span>
  );
}
