"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
        isActive
          ? "border-terracotta text-ink"
          : "border-transparent text-foreground/70 hover:border-terracotta/50 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
