import type { GuestWithPlusOnes } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { GuestRow, GuestCard } from "./guest-list-items";

export function GuestsList({
  guests,
  nestedIds,
  nameById,
  effectiveStatusById,
  selected,
  onToggleSelect,
  showPreviewLink,
}: {
  guests: GuestWithPlusOnes[];
  nestedIds: Set<string>;
  nameById: Record<string, string>;
  effectiveStatusById: Record<string, EffectiveRsvpStatus>;
  selected: Set<string>;
  onToggleSelect?: (guestId: string) => void;
  showPreviewLink?: boolean;
}) {
  const nameFor = (guestId: string | null) => (guestId ? nameById[guestId] : undefined);

  if (guests.length === 0) {
    return <p className="text-sm text-foreground/60">No guests match these filters.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <table className="hidden w-full text-left text-sm sm:table">
        <thead className="border-b border-border text-xs tracking-wide text-foreground/50 uppercase">
          <tr>
            {onToggleSelect && <th className="py-2 pr-2 font-medium" />}
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Priority / Invited by</th>
            <th className="py-2 pr-4 font-medium">RSVP</th>
            <th className="py-2 pr-4 font-medium">Language</th>
            <th className="py-2 pr-4 font-medium">Contact</th>
            <th className="py-2 pr-4 font-medium" />
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => (
            <GuestRow
              key={guest.id}
              guest={guest}
              linkedPlusOneCount={guest.plusOnes.length}
              delegateName={nameFor(guest.rsvpDelegateOf)}
              plusOneOfName={nameFor(guest.isPlusOneOf)}
              effectiveStatus={effectiveStatusById[guest.id] ?? "invited"}
              isNested={nestedIds.has(guest.id)}
              selected={selected.has(guest.id)}
              onToggleSelect={onToggleSelect}
              showPreviewLink={showPreviewLink}
            />
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 sm:hidden">
        {guests.map((guest) => {
          const isNested = nestedIds.has(guest.id);
          const card = (
            <GuestCard
              key={guest.id}
              guest={guest}
              linkedPlusOneCount={guest.plusOnes.length}
              delegateName={nameFor(guest.rsvpDelegateOf)}
              plusOneOfName={nameFor(guest.isPlusOneOf)}
              effectiveStatus={effectiveStatusById[guest.id] ?? "invited"}
              isNested={isNested}
              selected={selected.has(guest.id)}
              onToggleSelect={onToggleSelect}
              showPreviewLink={showPreviewLink}
            />
          );
          return isNested ? (
            <div key={guest.id} className="ml-4 border-l-2 border-sand pl-3">
              {card}
            </div>
          ) : (
            card
          );
        })}
      </div>
    </div>
  );
}
