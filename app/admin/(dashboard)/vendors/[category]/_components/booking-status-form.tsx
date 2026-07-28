"use client";

import { useActionState } from "react";
import { updateBookingStatus, type VendorActionState } from "@/lib/vendors/actions";
import type { Vendor } from "@/lib/vendors/types";

const initialState: VendorActionState = undefined;

export function BookingStatusForm({
  vendor,
  category,
}: {
  vendor: Vendor;
  category: string;
}) {
  const action = updateBookingStatus.bind(null, vendor.id, category);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-md border border-olive/30 bg-olive/5 p-3"
    >
      <p className="text-xs font-medium tracking-wide text-olive uppercase">Booking status</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="depositPaid"
              defaultChecked={vendor.depositPaid}
              className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
            />
            Deposit paid
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink">
            Amount (€)
            <input
              type="number"
              min="0"
              step="0.01"
              name="depositAmount"
              defaultValue={vendor.depositAmount ?? ""}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink">
            Date
            <input type="date" name="depositDate" defaultValue={vendor.depositDate ?? ""} className="input" />
          </label>
        </div>
        <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              name="fullyPaid"
              defaultChecked={vendor.fullyPaid}
              className="h-4 w-4 rounded border-border text-aegean focus:ring-aegean"
            />
            Fully paid
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink">
            Amount (€)
            <input
              type="number"
              min="0"
              step="0.01"
              name="fullyPaidAmount"
              defaultValue={vendor.fullyPaidAmount ?? ""}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink">
            Date
            <input
              type="date"
              name="fullyPaidDate"
              defaultValue={vendor.fullyPaidDate ?? ""}
              className="input"
            />
          </label>
        </div>
      </div>
      {state?.message && <p className="text-xs text-foreground/60">{state.message}</p>}
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-olive px-4 py-1.5 text-xs font-medium text-whitewash transition disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save booking status"}
        </button>
      </div>
    </form>
  );
}
