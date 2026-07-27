import {
  RELATIONSHIP_PRIORITY_LABELS,
  type RelationshipPriority,
} from "@/lib/guests/types";

const BADGE_CLASSES: Record<RelationshipPriority, string> = {
  1: "bg-terracotta/15 text-terracotta",
  2: "bg-gold/20 text-gold",
  3: "bg-olive/15 text-olive",
  4: "bg-aegean-light/15 text-aegean",
  5: "bg-sand text-ink/60",
};

export function PriorityBadge({ priority }: { priority: RelationshipPriority }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${BADGE_CLASSES[priority]}`}
    >
      {RELATIONSHIP_PRIORITY_LABELS[priority]}
    </span>
  );
}
