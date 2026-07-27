import { WEDDING_PARTY_ROLE_LABELS, type WeddingPartyRole } from "@/lib/guests/types";

export function RoleBadge({
  role,
  onRemove,
}: {
  role: WeddingPartyRole;
  onRemove?: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-olive/15 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-olive">
      {WEDDING_PARTY_ROLE_LABELS[role]}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${WEDDING_PARTY_ROLE_LABELS[role]}`}
          className="ml-0.5 text-olive/70 hover:text-olive"
        >
          ×
        </button>
      )}
    </span>
  );
}
