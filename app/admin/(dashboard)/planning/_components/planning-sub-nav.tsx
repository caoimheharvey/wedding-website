"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/planning", label: "Checklist" },
  { href: "/admin/planning/ideas", label: "Ideas" },
] as const;

export function PlanningSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/admin/planning" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-terracotta text-ink"
                : "border-transparent text-foreground/60 hover:border-terracotta/40 hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
