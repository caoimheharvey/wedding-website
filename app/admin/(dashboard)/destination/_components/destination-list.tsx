"use client";

import { useState } from "react";
import type { Destination } from "@/lib/destinations/types";
import { DestinationCard } from "./destination-card";

function fmtMoney(amount: number | null): string {
  return amount != null ? `€${amount.toLocaleString()}` : "—";
}

function fmtBool(value: boolean): string {
  return value ? "Yes" : "No";
}

function CompareTable({ a, b }: { a: Destination; b: Destination }) {
  const rows: { label: string; a: string; b: string }[] = [
    { label: "Location", a: a.location ?? "—", b: b.location ?? "—" },
    { label: "Estimated cost", a: fmtMoney(a.estimatedCost), b: fmtMoney(b.estimatedCost) },
    { label: "Guest capacity", a: a.guestCapacityNotes ?? "—", b: b.guestCapacityNotes ?? "—" },
    { label: "Travel notes", a: a.travelNotes ?? "—", b: b.travelNotes ?? "—" },
    { label: "Pros", a: a.pros ?? "—", b: b.pros ?? "—" },
    { label: "Cons", a: a.cons ?? "—", b: b.cons ?? "—" },
    { label: "Selected", a: fmtBool(a.isSelected), b: fmtBool(b.isSelected) },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-aegean/30 bg-aegean-light/5 p-4">
      <h3 className="mb-3 font-display text-lg text-ink">
        Comparing {a.name} vs. {b.name}
      </h3>
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

export function DestinationList({ destinations }: { destinations: Destination[] }) {
  const [compareIds, setCompareIds] = useState<string[]>([]);

  function toggleCompare(destinationId: string) {
    setCompareIds((prev) => {
      if (prev.includes(destinationId)) return prev.filter((id) => id !== destinationId);
      if (prev.length >= 2) return prev;
      return [...prev, destinationId];
    });
  }

  const compareDestinations = compareIds
    .map((id) => destinations.find((destination) => destination.id === id))
    .filter((destination): destination is Destination => Boolean(destination));

  if (destinations.length === 0) {
    return <p className="text-sm text-foreground/60">No destinations yet. Add one above.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {compareDestinations.length === 2 && (
        <CompareTable a={compareDestinations[0]} b={compareDestinations[1]} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {destinations.map((destination) => (
          <DestinationCard
            key={destination.id}
            destination={destination}
            isComparing={compareIds.includes(destination.id)}
            compareDisabled={compareIds.length >= 2 && !compareIds.includes(destination.id)}
            onToggleCompare={() => toggleCompare(destination.id)}
          />
        ))}
      </div>
    </div>
  );
}
