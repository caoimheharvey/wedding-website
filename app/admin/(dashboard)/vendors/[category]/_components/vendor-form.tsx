"use client";

import { useActionState } from "react";
import { createVendor, updateVendor, type VendorActionState } from "@/lib/vendors/actions";
import type { Vendor } from "@/lib/vendors/types";
import type { Destination } from "@/lib/destinations/types";

const initialState: VendorActionState = undefined;

export function VendorForm({
  category,
  vendor,
  destinations,
  selectedDestinationId,
}: {
  category: string;
  vendor?: Vendor;
  destinations: Destination[];
  selectedDestinationId: string | null;
}) {
  const action = vendor
    ? updateVendor.bind(null, vendor.id, category)
    : createVendor.bind(null, category);
  const [state, formAction, isPending] = useActionState(action, initialState);

  // Once a destination is selected, new vendors are assumed to be for it —
  // no need to ask. Existing vendors keep whatever they were already tied
  // to (or left unset) rather than being silently reassigned.
  const skipDestinationPicker = selectedDestinationId !== null;
  const autoDestinationId = vendor ? (vendor.destinationId ?? "") : selectedDestinationId;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {skipDestinationPicker && <input type="hidden" name="destinationId" value={autoDestinationId ?? ""} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vendor name" error={state?.errors?.name?.[0]}>
          <input name="name" defaultValue={vendor?.name} required className="input" />
        </Field>
        <Field label="Contact name" error={state?.errors?.contactName?.[0]}>
          <input name="contactName" defaultValue={vendor?.contactName ?? ""} className="input" />
        </Field>
        <Field label="Email" error={state?.errors?.email?.[0]}>
          <input type="email" name="email" defaultValue={vendor?.email ?? ""} className="input" />
        </Field>
        <Field label="Phone" error={state?.errors?.phone?.[0]}>
          <input type="tel" name="phone" defaultValue={vendor?.phone ?? ""} className="input" />
        </Field>
        <Field label="Website" error={state?.errors?.website?.[0]}>
          <input
            type="url"
            name="website"
            defaultValue={vendor?.website ?? ""}
            className="input"
            placeholder="https://…"
          />
        </Field>
        <Field label="Price quote (€)" error={state?.errors?.priceQuote?.[0]}>
          <input
            type="number"
            min="0"
            step="0.01"
            name="priceQuote"
            defaultValue={vendor?.priceQuote ?? ""}
            className="input"
          />
        </Field>
        {!skipDestinationPicker && (
          <Field label="Destination (optional)" error={state?.errors?.destinationId?.[0]}>
            <select name="destinationId" defaultValue={vendor?.destinationId ?? ""} className="input">
              <option value="">Not linked to a destination</option>
              {destinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>

      <Field label="Notes" error={state?.errors?.notes?.[0]}>
        <textarea name="notes" defaultValue={vendor?.notes ?? ""} rows={4} className="input" />
      </Field>

      {state?.message && <p className="text-sm text-terracotta">{state.message}</p>}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : vendor ? "Save changes" : "Add vendor"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink">
      {label}
      {children}
      {error && <span className="text-xs text-terracotta">{error}</span>}
    </label>
  );
}
