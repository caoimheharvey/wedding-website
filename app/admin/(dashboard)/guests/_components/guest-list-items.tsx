import Link from "next/link";
import { PREFERRED_LANGUAGE_LABELS, type GuestWithPlusOnes } from "@/lib/guests/types";
import type { EffectiveRsvpStatus } from "@/lib/rsvp/status";
import { PriorityBadge } from "./priority-badge";
import { RoleBadge } from "./role-badge";
import { InvitedByBadge } from "./invited-by-badge";
import { RsvpStatusSelect } from "./rsvp-status-select";
import { DeleteGuestButton } from "./delete-guest-button";

function guestName(guest: { firstName: string; lastName: string }) {
  return `${guest.firstName} ${guest.lastName}`;
}

function GuestMeta({
  guest,
  delegateName,
  plusOneOfName,
}: {
  guest: GuestWithPlusOnes;
  delegateName?: string;
  plusOneOfName?: string;
}) {
  return (
    <>
      {guest.partyRoles.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {guest.partyRoles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
        </div>
      )}
      {guest.isPlusOneOf && plusOneOfName && (
        <div className="mt-1 text-xs text-foreground/50">Plus-one of {plusOneOfName}</div>
      )}
      {guest.rsvpDelegateFor.length > 0 && (
        <div className="mt-1 text-xs text-aegean">
          RSVPs for: {guest.rsvpDelegateFor.map(guestName).join(", ")}
        </div>
      )}
      {guest.rsvpDelegateOf && delegateName && (
        <div className="mt-1 text-xs text-foreground/50">RSVP via {delegateName}</div>
      )}
      {guest.rsvpDeadlineOverride && (
        <div className="mt-1 text-xs text-gold">
          RSVP deadline: {guest.rsvpDeadlineOverride} (override)
        </div>
      )}
      {guest.notes && (
        <div className="mt-1 text-xs text-foreground/60 italic">{guest.notes}</div>
      )}
    </>
  );
}

function SelectCheckbox({
  guestId,
  selected,
  onToggleSelect,
}: {
  guestId: string;
  selected?: boolean;
  onToggleSelect?: (guestId: string) => void;
}) {
  if (!onToggleSelect) return null;
  return (
    <input
      type="checkbox"
      checked={selected ?? false}
      onChange={() => onToggleSelect(guestId)}
      aria-label={`Select guest`}
      className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
    />
  );
}

export function GuestRow({
  guest,
  linkedPlusOneCount,
  delegateName,
  plusOneOfName,
  effectiveStatus,
  selected,
  onToggleSelect,
  showPreviewLink,
}: {
  guest: GuestWithPlusOnes;
  linkedPlusOneCount: number;
  delegateName?: string;
  plusOneOfName?: string;
  effectiveStatus: EffectiveRsvpStatus;
  selected?: boolean;
  onToggleSelect?: (guestId: string) => void;
  showPreviewLink?: boolean;
}) {
  return (
    <tr className="border-b border-border/60 align-top">
      {onToggleSelect && (
        <td className="py-3 pr-2">
          <SelectCheckbox
            guestId={guest.id}
            selected={selected}
            onToggleSelect={onToggleSelect}
          />
        </td>
      )}
      <td className="py-3 pr-4">
        <span className="font-medium text-ink">{guestName(guest)}</span>
        <GuestMeta guest={guest} delegateName={delegateName} plusOneOfName={plusOneOfName} />
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-col items-start gap-1">
          <PriorityBadge priority={guest.relationshipPriority} />
          <InvitedByBadge invitedBy={guest.invitedBy} />
        </div>
      </td>
      <td className="py-3 pr-4">
        <RsvpStatusSelect
          guestId={guest.id}
          status={guest.rsvpStatus}
          effectiveStatus={effectiveStatus}
        />
      </td>
      <td className="py-3 pr-4">{PREFERRED_LANGUAGE_LABELS[guest.preferredLanguage]}</td>
      <td className="py-3 pr-4 text-foreground/70">
        {guest.email && <div>{guest.email}</div>}
        {guest.phone && <div>{guest.phone}</div>}
      </td>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          {showPreviewLink && (
            <Link
              href={`/guest/${guest.id}`}
              target="_blank"
              className="text-sm font-medium text-olive hover:underline"
            >
              Preview
            </Link>
          )}
          <Link
            href={`/admin/guests/${guest.id}/edit`}
            className="text-sm font-medium text-aegean hover:underline"
          >
            Edit
          </Link>
          <DeleteGuestButton
            guestId={guest.id}
            guestName={guestName(guest)}
            linkedPlusOneCount={linkedPlusOneCount}
          />
        </div>
      </td>
    </tr>
  );
}

export function GuestCard({
  guest,
  linkedPlusOneCount,
  delegateName,
  plusOneOfName,
  effectiveStatus,
  selected,
  onToggleSelect,
  showPreviewLink,
}: {
  guest: GuestWithPlusOnes;
  linkedPlusOneCount: number;
  delegateName?: string;
  plusOneOfName?: string;
  effectiveStatus: EffectiveRsvpStatus;
  selected?: boolean;
  onToggleSelect?: (guestId: string) => void;
  showPreviewLink?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <SelectCheckbox guestId={guest.id} selected={selected} onToggleSelect={onToggleSelect} />
          <div>
            <p className="font-medium text-ink">{guestName(guest)}</p>
            <GuestMeta guest={guest} delegateName={delegateName} plusOneOfName={plusOneOfName} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <PriorityBadge priority={guest.relationshipPriority} />
          <InvitedByBadge invitedBy={guest.invitedBy} />
          <RsvpStatusSelect
            guestId={guest.id}
            status={guest.rsvpStatus}
            effectiveStatus={effectiveStatus}
          />
        </div>
      </div>
      <dl className="mt-2 flex flex-col gap-1 text-sm text-foreground/70">
        <div>{PREFERRED_LANGUAGE_LABELS[guest.preferredLanguage]}</div>
        {guest.email && <div>{guest.email}</div>}
        {guest.phone && <div>{guest.phone}</div>}
      </dl>
      <div className="mt-3 flex items-center gap-4">
        {showPreviewLink && (
          <Link
            href={`/guest/${guest.id}`}
            target="_blank"
            className="text-sm font-medium text-olive hover:underline"
          >
            Preview
          </Link>
        )}
        <Link
          href={`/admin/guests/${guest.id}/edit`}
          className="text-sm font-medium text-aegean hover:underline"
        >
          Edit
        </Link>
        <DeleteGuestButton
          guestId={guest.id}
          guestName={guestName(guest)}
          linkedPlusOneCount={linkedPlusOneCount}
        />
      </div>
    </div>
  );
}
