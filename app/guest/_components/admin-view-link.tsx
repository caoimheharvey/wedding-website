import Link from "next/link";

export function AdminViewLink() {
  return (
    <div className="flex w-full justify-end">
      <Link
        href="/admin"
        className="rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground/50 transition hover:border-aegean hover:text-aegean"
      >
        Admin View
      </Link>
    </div>
  );
}
