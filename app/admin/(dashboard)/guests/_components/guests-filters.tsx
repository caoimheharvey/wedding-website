import {
  INVITED_BY_LABELS,
  INVITED_BY_OPTIONS,
  RELATIONSHIP_PRIORITIES,
  RELATIONSHIP_PRIORITY_LABELS,
  type InvitedBy,
  type RelationshipPriority,
} from "@/lib/guests/types";
import { EFFECTIVE_RSVP_STATUS_LABELS, type EffectiveRsvpStatus } from "@/lib/rsvp/status";

const RSVP_FILTER_OPTIONS: EffectiveRsvpStatus[] = ["invited", "yes", "no", "deadline_missed"];

export type PriorityFilter = RelationshipPriority | "all";
export type InvitedByFilter = InvitedBy | "all";
export type RsvpFilter = EffectiveRsvpStatus | "all";

export function GuestsFilters({
  priority,
  onPriorityChange,
  invitedBy,
  onInvitedByChange,
  rsvp,
  onRsvpChange,
}: {
  priority: PriorityFilter;
  onPriorityChange: (value: PriorityFilter) => void;
  invitedBy: InvitedByFilter;
  onInvitedByChange: (value: InvitedByFilter) => void;
  rsvp: RsvpFilter;
  onRsvpChange: (value: RsvpFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-ink">Filter:</span>
      <select
        value={priority}
        onChange={(event) =>
          onPriorityChange(
            event.target.value === "all"
              ? "all"
              : (Number(event.target.value) as RelationshipPriority),
          )
        }
        className="input w-auto"
      >
        <option value="all">All priorities</option>
        {RELATIONSHIP_PRIORITIES.map((option) => (
          <option key={option} value={option}>
            {RELATIONSHIP_PRIORITY_LABELS[option]}
          </option>
        ))}
      </select>
      <select
        value={invitedBy}
        onChange={(event) => onInvitedByChange(event.target.value as InvitedByFilter)}
        className="input w-auto"
      >
        <option value="all">All invited by</option>
        {INVITED_BY_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {INVITED_BY_LABELS[option]}
          </option>
        ))}
      </select>
      <select
        value={rsvp}
        onChange={(event) => onRsvpChange(event.target.value as RsvpFilter)}
        className="input w-auto"
      >
        <option value="all">All RSVP statuses</option>
        {RSVP_FILTER_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {EFFECTIVE_RSVP_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
