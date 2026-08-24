/** Marks an admin-granted permission (plus-one, children) on a guest row/card. */
export function GrantBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-ink">
      {label}
    </span>
  );
}
