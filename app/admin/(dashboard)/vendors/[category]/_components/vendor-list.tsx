"use client";

import { useState } from "react";
import type { Vendor } from "@/lib/vendors/types";
import type { Destination } from "@/lib/destinations/types";
import { getBudgetFit } from "@/lib/vendors/budget-fit";
import { VendorCard } from "./vendor-card";

function fmtMoney(amount: number | null): string {
  return amount != null ? `€${amount.toLocaleString()}` : "—";
}

function fmtBool(value: boolean): string {
  return value ? "Yes" : "No";
}

function fmtBudgetFit(priceQuote: number | null, categoryBudgeted: number): string {
  const fit = getBudgetFit(priceQuote, categoryBudgeted);
  if (!fit) return "—";
  return fit.status === "over" ? `€${fit.overBy.toLocaleString()} over budget` : "In budget";
}

function CompareTable({
  a,
  b,
  categoryBudgeted,
}: {
  a: Vendor;
  b: Vendor;
  categoryBudgeted: number;
}) {
  const rows: { label: string; a: string; b: string }[] = [
    { label: "Contact", a: a.contactName ?? "—", b: b.contactName ?? "—" },
    { label: "Email", a: a.email ?? "—", b: b.email ?? "—" },
    { label: "Phone", a: a.phone ?? "—", b: b.phone ?? "—" },
    { label: "Price quote", a: fmtMoney(a.priceQuote), b: fmtMoney(b.priceQuote) },
    {
      label: "Budget fit",
      a: fmtBudgetFit(a.priceQuote, categoryBudgeted),
      b: fmtBudgetFit(b.priceQuote, categoryBudgeted),
    },
    { label: "Selected vendor", a: fmtBool(a.isSelected), b: fmtBool(b.isSelected) },
    { label: "Deposit paid", a: fmtBool(a.depositPaid), b: fmtBool(b.depositPaid) },
    { label: "Fully paid", a: fmtBool(a.fullyPaid), b: fmtBool(b.fullyPaid) },
    { label: "Notes", a: a.notes ?? "—", b: b.notes ?? "—" },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-aegean/30 bg-aegean-light/5 p-4">
      <h3 className="mb-3 font-display text-lg text-ink">Comparing {a.name} vs. {b.name}</h3>
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-border text-xs tracking-wide text-foreground/50 uppercase">
          <tr>
            <th className="py-2 pr-4 font-medium" />
            <th className="py-2 pr-4 font-medium">{a.name}</th>
            <th className="py-2 pr-4 font-medium">{b.name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border/60 align-top">
              <td className="py-2 pr-4 font-medium text-ink">{row.label}</td>
              <td className="py-2 pr-4 text-foreground/70">{row.a}</td>
              <td className="py-2 pr-4 text-foreground/70">{row.b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VendorList({
  vendors,
  category,
  categoryBudgeted,
  destinations,
  selectedDestination,
}: {
  vendors: Vendor[];
  category: string;
  categoryBudgeted: number;
  destinations: Destination[];
  selectedDestination: Destination | null;
}) {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  function toggleCompare(vendorId: string) {
    setCompareIds((prev) => {
      if (prev.includes(vendorId)) return prev.filter((id) => id !== vendorId);
      if (prev.length >= 2) return prev;
      return [...prev, vendorId];
    });
  }

  const compareVendors = compareIds.map((id) => vendors.find((vendor) => vendor.id === id)).filter(
    (vendor): vendor is Vendor => Boolean(vendor),
  );

  if (vendors.length === 0) {
    return <p className="text-sm text-foreground/60">No vendors yet. Add one above.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {compareVendors.length === 2 && (
        <CompareTable a={compareVendors[0]} b={compareVendors[1]} categoryBudgeted={categoryBudgeted} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {vendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            category={category}
            categoryBudgeted={categoryBudgeted}
            isComparing={compareIds.includes(vendor.id)}
            compareDisabled={compareIds.length >= 2 && !compareIds.includes(vendor.id)}
            onToggleCompare={() => toggleCompare(vendor.id)}
            selectedDestination={selectedDestination}
            vendorDestinationName={
              vendor.destinationId
                ? (destinations.find((d) => d.id === vendor.destinationId)?.name ?? null)
                : null
            }
          />
        ))}
      </div>
    </div>
  );
}
