import type { Guest } from "@/lib/guests/types";

/** Dropdown list for guest search — pointerdown selection avoids mobile blur-before-tap issues. */
export function GuestSearchResults({
  matches,
  onSelect,
  getLabel,
  className = "w-full",
}: {
  matches: Guest[];
  onSelect: (guest: Guest) => void;
  getLabel?: (guest: Guest) => string;
  className?: string;
}) {
  if (matches.length === 0) return null;

  const labelFor = getLabel ?? ((guest: Guest) => `${guest.firstName} ${guest.lastName}`.trim());

  return (
    <ul
      className={`absolute z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-surface shadow-lg ${className}`}
    >
      {matches.map((guest) => (
        <li key={guest.id}>
          <button
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              onSelect(guest);
            }}
            className="block w-full px-3 py-3 text-left text-sm text-ink hover:bg-sand/50 active:bg-sand/50"
          >
            {labelFor(guest)}
          </button>
        </li>
      ))}
    </ul>
  );
}
