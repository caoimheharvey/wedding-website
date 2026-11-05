"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/budget/format";
import { estimatedTotal, hireInclVat } from "@/lib/venues/pricing";
import {
  CATERING_TYPE_LABELS,
  COORDINATION_LABELS,
  OUTREACH_STATUS_LABELS,
  type VenueDetails,
} from "@/lib/venues/types";
import type { Vendor } from "@/lib/vendors/types";

const DASH = "—";

const money = (value: number | null) => (value === null ? DASH : formatCurrency(value));
const yesNo = (value: boolean | null) => (value === null ? DASH : value ? "Yes" : "No");
const plain = (value: string | number | null) => (value === null || value === "" ? DASH : String(value));

interface Row {
  label: string;
  value: (details: VenueDetails, guestCount: number) => string;
}

interface Section {
  title: string;
  rows: Row[];
}

const SECTIONS: Section[] = [
  {
    title: "Availability & space",
    rows: [
      { label: "Available Saturdays", value: (d) => plain(d.availableDates) },
      { label: "Exclusive hire", value: (d) => yesNo(d.exclusiveHire) },
      { label: "Max capacity", value: (d) => plain(d.maxCapacity) },
      { label: "Hire window", value: (d) => plain(d.hireHours) },
    ],
  },
  {
    title: "Price",
    rows: [
      {
        label: "Saturday hire fee",
        value: (d) =>
          d.rentalFeeSaturday === null
            ? DASH
            : `${formatCurrency(d.rentalFeeSaturday)} ${d.feeIncludesVat ? "incl. VAT" : `+ ${d.vatPercent}% VAT`}`,
      },
      { label: "Hire incl. VAT", value: (d) => money(hireInclVat(d)) },
      { label: "Price per person", value: (d) => money(d.pricePerPerson) },
      { label: "Minimum spend", value: (d) => money(d.minSpend) },
      { label: "Minimum guests", value: (d) => plain(d.minGuests) },
      { label: "Other costs", value: (d) => plain(d.otherCosts) },
    ],
  },
  {
    title: "Hours & bar",
    rows: [
      { label: "Open bar hours", value: (d) => plain(d.barHoursIncluded) },
      { label: "Extra bar hour", value: (d) => money(d.extraBarHourCost) },
      { label: "Music / curfew", value: (d) => plain(d.musicCurfew) },
      { label: "Ceremony on site", value: (d) => yesNo(d.ceremonyOnSite) },
      { label: "Setup & teardown included", value: (d) => yesNo(d.setupTeardownIncluded) },
    ],
  },
  {
    title: "Catering & coordination",
    rows: [
      { label: "Catering", value: (d) => (d.cateringType ? CATERING_TYPE_LABELS[d.cateringType] : DASH) },
      { label: "Coordination", value: (d) => (d.coordination ? COORDINATION_LABELS[d.coordination] : DASH) },
      { label: "Coordination cost", value: (d) => money(d.coordinationCost) },
    ],
  },
  {
    title: "Accommodation",
    rows: [
      { label: "Rooms on site", value: (d) => yesNo(d.onsiteAccommodation) },
      { label: "Nearby", value: (d) => plain(d.accommodationNotes) },
    ],
  },
  {
    title: "Booking terms",
    rows: [
      { label: "Deposit", value: (d) => money(d.depositAmount) },
      { label: "Payment schedule", value: (d) => plain(d.paymentSchedule) },
      { label: "Cancellation", value: (d) => plain(d.cancellationPolicy) },
    ],
  },
];

export function VenueComparison({
  venues,
  detailsByVendorId,
  category,
}: {
  venues: Vendor[];
  detailsByVendorId: Record<string, VenueDetails>;
  category: string;
}) {
  const [guestCount, setGuestCount] = useState(100);
  const [showAll, setShowAll] = useState(false);

  const columns = venues
    .map((vendor) => ({ vendor, details: detailsByVendorId[vendor.id] ?? null }))
    .filter(
      (column): column is { vendor: Vendor; details: VenueDetails } =>
        column.details !== null && (showAll || column.details.outreachStatus === "replied"),
    );

  const totals = columns.map((column) => estimatedTotal(column.details, guestCount));
  // A hire-only figure (no per-person price) isn't comparable to an all-in
  // one, so only highlight "lowest" within the same kind of total — all-in
  // figures if two or more exist, otherwise the hire-only ones.
  const isAllIn = columns.map((column) => column.details.pricePerPerson !== null);
  const comparableTotals = (allIn: boolean) =>
    totals.filter((total, index): total is number => total !== null && isAllIn[index] === allIn);
  const allInTotals = comparableTotals(true);
  const highlightAllIn = allInTotals.length > 1;
  const hireOnlyTotals = comparableTotals(false);
  const lowest = highlightAllIn
    ? Math.min(...allInTotals)
    : allInTotals.length === 0 && hireOnlyTotals.length > 1
      ? Math.min(...hireOnlyTotals)
      : null;
  const isLowest = (total: number | null, index: number) =>
    lowest !== null && total === lowest && (highlightAllIn ? isAllIn[index] : !isAllIn[index]);

  return (
    <div className="flex flex-col gap-3 glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-ink">Compare venues</h2>
          <p className="text-sm text-foreground/60">
            {showAll ? "All venues with details" : "Venues that have replied"}, side by side.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-ink">
            Guests
            <input
              type="number"
              min="1"
              value={guestCount}
              onChange={(event) => setGuestCount(Math.max(1, Number(event.target.value) || 1))}
              className="input w-24"
            />
          </label>
          <label className="flex items-center gap-2 text-ink">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(event) => setShowAll(event.target.checked)}
              className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
            />
            Include not-yet-replied
          </label>
        </div>
      </div>

      {columns.length === 0 ? (
        <p className="text-sm text-foreground/60">
          No replies recorded yet. Open a venue, paste its reply, and save it to compare here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-border text-xs tracking-wide text-foreground/50 uppercase">
              <tr>
                <th className="py-2 pr-4 font-medium" />
                {columns.map(({ vendor, details }) => (
                  <th key={vendor.id} className="py-2 pr-4 align-bottom font-medium">
                    <Link
                      href={`/admin/vendors/${category}/${vendor.id}/edit`}
                      className="font-display text-base tracking-normal text-aegean normal-case hover:underline"
                    >
                      {vendor.name}
                    </Link>
                    <div className="font-normal normal-case">
                      {OUTREACH_STATUS_LABELS[details.outreachStatus]}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border bg-aegean/5 align-top">
                <td className="py-2 pr-4 font-medium text-ink">
                  Est. total
                  <div className="text-xs font-normal text-foreground/50">for {guestCount} guests</div>
                </td>
                {totals.map((total, index) => (
                  <td
                    key={columns[index].vendor.id}
                    className={`py-2 pr-4 font-medium ${isLowest(total, index) ? "text-olive" : "text-ink"}`}
                  >
                    {money(total)}
                    {isLowest(total, index) && (
                      <span className="ml-2 rounded-full bg-olive/15 px-2 py-0.5 text-xs">lowest</span>
                    )}
                    {total !== null && !isAllIn[index] && (
                      <div className="text-xs font-normal text-foreground/50">
                        hire only — catering extra
                      </div>
                    )}
                  </td>
                ))}
              </tr>
              {SECTIONS.map((section) => (
                <SectionRows
                  key={section.title}
                  section={section}
                  columns={columns}
                  guestCount={guestCount}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-foreground/50">
        Est. total = hire incl. VAT + price per person × guests (as quoted), raised to the minimum
        spend if there is one. A dash means the venue didn&apos;t say.
      </p>
    </div>
  );
}

function SectionRows({
  section,
  columns,
  guestCount,
}: {
  section: Section;
  columns: { vendor: Vendor; details: VenueDetails }[];
  guestCount: number;
}) {
  return (
    <>
      <tr>
        <td
          colSpan={columns.length + 1}
          className="pt-4 pb-1 text-xs font-medium tracking-wide text-foreground/50 uppercase"
        >
          {section.title}
        </td>
      </tr>
      {section.rows.map((row) => (
        <tr key={row.label} className="border-b border-border/60 align-top">
          <td className="py-2 pr-4 font-medium text-ink">{row.label}</td>
          {columns.map(({ vendor, details }) => (
            <td key={vendor.id} className="py-2 pr-4 text-foreground/70">
              {row.value(details, guestCount)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
