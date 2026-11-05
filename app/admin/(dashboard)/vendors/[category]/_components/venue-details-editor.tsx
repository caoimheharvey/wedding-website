"use client";

import { useActionState, useState, useTransition } from "react";
import { saveVenueDetails, type VenueDetailsActionState } from "@/lib/venues/actions";
import { aiExtractVenueReply } from "@/lib/venues/ai-actions";
import { fieldsToForm, emptyVenueFields, type VenueDetailsForm } from "@/lib/venues/schema";
import {
  CATERING_TYPE_LABELS,
  CATERING_TYPES,
  COORDINATION_LABELS,
  COORDINATION_TYPES,
  OUTREACH_STATUS_LABELS,
  OUTREACH_STATUSES,
  UPDATE_KIND_LABELS,
  UPDATE_KINDS,
  type UpdateKind,
  type VenueDetails,
} from "@/lib/venues/types";

type Values = Record<keyof VenueDetailsForm, string>;

const initialState: VenueDetailsActionState = undefined;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-foreground/50">{hint}</span>}
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <legend className="px-1 text-xs font-medium tracking-wide text-foreground/50 uppercase">
        {title}
      </legend>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function VenueDetailsEditor({
  vendorId,
  category,
  details,
  today,
}: {
  vendorId: string;
  category: string;
  details: VenueDetails | null;
  /** ISO date used as the default date of a new update. */
  today: string;
}) {
  const action = saveVenueDetails.bind(null, vendorId, category);
  const [state, formAction, isPending] = useActionState(action, initialState);
  // What's saved now — the baseline for "was …" hints on fields this update changes.
  const [baseline] = useState<Values>(() => fieldsToForm(details ?? emptyVenueFields()));
  const [values, setValues] = useState<Values>(baseline);
  const [updateKind, setUpdateKind] = useState<UpdateKind>("reply");
  const [updateDate, setUpdateDate] = useState(today);
  const [updateText, setUpdateText] = useState("");
  const [aiPending, startAi] = useTransition();
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  function set(key: keyof Values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  /** Shown under a field whose value differs from what's currently saved. */
  function was(key: keyof Values, show?: (value: string) => string) {
    if (values[key] === baseline[key]) return null;
    const previous = baseline[key];
    const shown = previous === "" ? "not stated" : show ? show(previous) : previous;
    return <span className="text-xs font-normal text-aegean">was: {shown}</span>;
  }

  const triLabel = (value: string) => (value === "yes" ? "Yes" : value === "no" ? "No" : value);

  function text(key: keyof Values, rows?: number) {
    return (
      <>
        {rows ? (
          <textarea
            name={key}
            value={values[key]}
            onChange={(event) => set(key, event.target.value)}
            rows={rows}
            className="input"
          />
        ) : (
          <input
            name={key}
            value={values[key]}
            onChange={(event) => set(key, event.target.value)}
            className="input"
          />
        )}
        {was(key)}
      </>
    );
  }

  function number(key: keyof Values, step = "1") {
    return (
      <>
        <input
          type="number"
          min="0"
          step={step}
          name={key}
          value={values[key]}
          onChange={(event) => set(key, event.target.value)}
          className="input"
        />
        {was(key)}
      </>
    );
  }

  function triState(key: keyof Values) {
    return (
      <>
        <select
          name={key}
          value={values[key]}
          onChange={(event) => set(key, event.target.value)}
          className="input"
        >
          <option value="">Not stated</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
        {was(key, triLabel)}
      </>
    );
  }

  function handleAiFill() {
    startAi(async () => {
      const result = await aiExtractVenueReply(updateText);
      if (result.values) {
        const filled = result.values;
        setValues((current) => ({
          ...current,
          ...filled,
          outreachStatus:
            updateKind === "reply" &&
            (current.outreachStatus === "not_contacted" || current.outreachStatus === "contacted")
              ? "replied"
              : current.outreachStatus,
        }));
        setAiMessage(
          `Found ${Object.keys(filled).length} answers in the text — fields that changed are marked "was: …". Check them, then save.`,
        );
      } else {
        setAiMessage(result.message ?? "Couldn't read the reply.");
      }
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl text-ink">Update this venue</h2>
        <p className="text-sm text-foreground/60">
          Log each reply, visit, or call as it happens. Anything the update doesn&apos;t mention
          stays as it was, and every change is kept in the history below.
        </p>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-aegean/30 bg-aegean/5 p-4">
        <legend className="px-1 text-xs font-medium tracking-wide text-aegean uppercase">
          This update
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="What happened?">
            <select
              name="updateKind"
              value={updateKind}
              onChange={(event) => setUpdateKind(event.target.value as UpdateKind)}
              className="input"
            >
              {UPDATE_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {UPDATE_KIND_LABELS[kind]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date" hint="A future date works for a planned visit.">
            <input
              type="date"
              name="updateDate"
              value={updateDate}
              onChange={(event) => setUpdateDate(event.target.value)}
              className="input"
              required
            />
          </Field>
        </div>
        <Field
          label={updateKind === "reply" ? "Paste their email" : "Notes"}
          hint="Optional — kept in the history so you can look back at exactly what was said."
        >
          <textarea
            name="updateText"
            value={updateText}
            onChange={(event) => setUpdateText(event.target.value)}
            rows={8}
            className="input"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAiFill}
            disabled={aiPending}
            className="text-xs font-medium text-aegean hover:underline disabled:opacity-50"
          >
            {aiPending ? "Reading the text…" : "AI: fill fields from this text"}
          </button>
          {aiMessage && <span className="text-xs text-foreground/60">{aiMessage}</span>}
        </div>
      </fieldset>

      <Group title="Where things stand">
        <Field label="Status">
          <select
            name="outreachStatus"
            value={values.outreachStatus}
            onChange={(event) => set("outreachStatus", event.target.value)}
            className="input"
          >
            {OUTREACH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {OUTREACH_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          {was("outreachStatus", (value) => OUTREACH_STATUS_LABELS[value as keyof typeof OUTREACH_STATUS_LABELS])}
        </Field>
      </Group>

      <Group title="1. Availability & space">
        <Field label="Available Saturdays (Sep/Oct 2028)">{text("availableDates")}</Field>
        <Field label="Exclusive hire?">{triState("exclusiveHire")}</Field>
        <Field label="Max capacity (guests)">{number("maxCapacity")}</Field>
        <Field label="Hire window">{text("hireHours")}</Field>
      </Group>

      <Group title="2. Price">
        <Field label="Saturday hire fee (€)">{number("rentalFeeSaturday", "0.01")}</Field>
        <Field label="Fee already includes VAT?">
          <select
            name="feeIncludesVat"
            value={values.feeIncludesVat}
            onChange={(event) => set("feeIncludesVat", event.target.value)}
            className="input"
          >
            <option value="no">No — VAT added on top</option>
            <option value="yes">Yes — VAT included</option>
          </select>
          {was("feeIncludesVat", triLabel)}
        </Field>
        <Field label="VAT (%)">{number("vatPercent", "0.1")}</Field>
        <Field label="Price per person (€)">{number("pricePerPerson", "0.01")}</Field>
        <Field label="Minimum spend (€)">{number("minSpend", "0.01")}</Field>
        <Field label="Minimum guests">{number("minGuests")}</Field>
        <div className="sm:col-span-2">
          <Field label="Other costs & inclusions" hint="Cleaning, security, corkage, service, overtime…">
            {text("otherCosts", 2)}
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Estimate notes">{text("estimateNotes", 2)}</Field>
        </div>
      </Group>

      <Group title="3. Hours & bar">
        <Field label="Open bar hours included">{number("barHoursIncluded", "0.5")}</Field>
        <Field label="Extra bar hour (€)">{number("extraBarHourCost", "0.01")}</Field>
        <Field label="Music / party curfew">{text("musicCurfew")}</Field>
        <Field label="Ceremony on site?">{triState("ceremonyOnSite")}</Field>
        <Field label="Setup & teardown included?">{triState("setupTeardownIncluded")}</Field>
      </Group>

      <Group title="4. Catering & coordination">
        <Field label="Catering">
          <select
            name="cateringType"
            value={values.cateringType}
            onChange={(event) => set("cateringType", event.target.value)}
            className="input"
          >
            <option value="">Not stated</option>
            {CATERING_TYPES.map((type) => (
              <option key={type} value={type}>
                {CATERING_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          {was("cateringType", (value) => CATERING_TYPE_LABELS[value as keyof typeof CATERING_TYPE_LABELS])}
        </Field>
        <Field label="Coordination">
          <select
            name="coordination"
            value={values.coordination}
            onChange={(event) => set("coordination", event.target.value)}
            className="input"
          >
            <option value="">Not stated</option>
            {COORDINATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {COORDINATION_LABELS[type]}
              </option>
            ))}
          </select>
          {was("coordination", (value) => COORDINATION_LABELS[value as keyof typeof COORDINATION_LABELS])}
        </Field>
        <Field label="Coordination cost (€)">{number("coordinationCost", "0.01")}</Field>
      </Group>

      <Group title="5. Accommodation">
        <Field label="Rooms for guests on site?">{triState("onsiteAccommodation")}</Field>
        <Field label="Nearby options">{text("accommodationNotes")}</Field>
      </Group>

      <Group title="6. Booking terms">
        <Field label="Deposit (€)">{number("depositAmount", "0.01")}</Field>
        <div className="sm:col-span-2">
          <Field label="Payment schedule">{text("paymentSchedule", 2)}</Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Cancellation / date change policy">{text("cancellationPolicy", 2)}</Field>
        </div>
      </Group>

      {state?.message && <p className="text-sm text-foreground/70">{state.message}</p>}
      {state?.errors && (
        <ul className="text-sm text-terracotta">
          {Object.entries(state.errors).map(([field, messages]) =>
            messages?.map((message) => <li key={`${field}-${message}`}>{message}</li>),
          )}
        </ul>
      )}

      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-aegean px-5 py-2 text-sm font-medium text-whitewash transition hover:bg-aegean-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save update"}
        </button>
      </div>
    </form>
  );
}
