"use client";

import { useState, useTransition } from "react";
import { saveVenueProfile } from "@/lib/venues/costs/actions";
import type { ProfilePatch } from "@/lib/venues/costs/schema";
import {
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
  DOG_POLICIES,
  DOG_POLICY_LABELS,
  ENGLISH_SUPPORT,
  ENGLISH_SUPPORT_LABELS,
  TRI_STATES,
  type Confidence,
  type DogPolicy,
  type EnglishSupport,
  type FieldMeta,
  type TriState,
  type VenueProfile,
} from "@/lib/venues/analysis/types";
import { SaveBar } from "./venue-editor-parts";

const KEY_FACTS: { key: string; label: string }[] = [
  { key: "availableDates", label: "Available dates" },
  { key: "maxCapacity", label: "Max capacity" },
  { key: "minGuests", label: "Minimum guests" },
  { key: "minSpend", label: "Minimum spend" },
  { key: "hireHours", label: "Hire window" },
  { key: "exclusiveHire", label: "Exclusive hire" },
  { key: "musicCurfew", label: "Music / curfew" },
  { key: "coordination", label: "Coordination level" },
  { key: "vatPercent", label: "VAT rate" },
  { key: "depositAmount", label: "Deposit" },
  { key: "paymentSchedule", label: "Payment schedule" },
  { key: "cancellationPolicy", label: "Cancellation policy" },
];

const str = (value: number | string | null) => (value === null ? "" : String(value));
const toInt = (value: string) => (value.trim() === "" ? null : Math.round(Number(value)));
const toText = (value: string) => (value.trim() === "" ? null : value);

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-ink">
      {label}
      {children}
    </label>
  );
}

const TRI_LABELS: Record<TriState, string> = { yes: "Yes", no: "No", unknown: "Unknown" };

export function VenueProfileEditor({
  vendorId,
  category,
  profile,
}: {
  vendorId: string;
  category: string;
  profile: VenueProfile;
}) {
  const [form, setForm] = useState({
    location: profile.location ?? "",
    address: profile.address ?? "",
    ceremonyCapacity: str(profile.ceremonyCapacity),
    receptionCapacity: str(profile.receptionCapacity),
    partyCapacity: str(profile.partyCapacity),
    spaceNotes: profile.spaceNotes ?? "",
    dogPolicy: profile.dogPolicy,
    dogAccommodation: profile.dogAccommodation,
    dogNotes: profile.dogNotes ?? "",
    directFlightAmsterdam: profile.directFlightAmsterdam,
    logisticsNotes: profile.logisticsNotes ?? "",
    englishSupport: profile.englishSupport,
    outstandingQuestions: profile.outstandingQuestions ?? "",
  });
  const [meta, setMeta] = useState<Record<string, FieldMeta | null>>(() =>
    Object.fromEntries(KEY_FACTS.map((fact) => [fact.key, profile.fieldMeta[fact.key] ?? null])),
  );
  const [dirty, setDirty] = useState(false);
  const [result, setResult] = useState<{ message?: string; error?: string }>({});
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };
  const setFact = (key: string, patch: Partial<FieldMeta> | null) => {
    setMeta((current) => ({
      ...current,
      [key]: patch === null ? null : { confidence: "unknown", source: null, date: null, ...current[key], ...patch },
    }));
    setDirty(true);
  };

  const save = () =>
    startTransition(async () => {
      const patch: ProfilePatch = {
        location: toText(form.location),
        address: toText(form.address),
        ceremonyCapacity: toInt(form.ceremonyCapacity),
        receptionCapacity: toInt(form.receptionCapacity),
        partyCapacity: toInt(form.partyCapacity),
        spaceNotes: toText(form.spaceNotes),
        dogPolicy: form.dogPolicy,
        dogAccommodation: form.dogAccommodation,
        dogNotes: toText(form.dogNotes),
        directFlightAmsterdam: form.directFlightAmsterdam,
        logisticsNotes: toText(form.logisticsNotes),
        englishSupport: form.englishSupport,
        outstandingQuestions: toText(form.outstandingQuestions),
        fieldMeta: meta,
      };
      const response = await saveVenueProfile(vendorId, category, patch);
      setResult(response);
      if (!response.error) setDirty(false);
    });

  return (
    <div className="flex flex-col gap-4">
      <fieldset id="s3" className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-xs font-medium tracking-wide text-foreground/50 uppercase">Location and spaces</legend>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Location">
            <input value={form.location} onChange={(e) => set("location", e.target.value)} className="input" placeholder="Town / area" />
          </Field>
          <Field label="Full address">
            <input value={form.address} onChange={(e) => set("address", e.target.value)} className="input" placeholder="Street, postcode, town" />
          </Field>
          <Field label="Ceremony capacity">
            <input type="number" min="0" value={form.ceremonyCapacity} onChange={(e) => set("ceremonyCapacity", e.target.value)} className="input" />
          </Field>
          <Field label="Reception capacity (seated)">
            <input type="number" min="0" value={form.receptionCapacity} onChange={(e) => set("receptionCapacity", e.target.value)} className="input" />
          </Field>
          <Field label="Party space capacity">
            <input type="number" min="0" value={form.partyCapacity} onChange={(e) => set("partyCapacity", e.target.value)} className="input" />
          </Field>
        </div>
        <Field label="Spaces, layout and rain plan">
          <textarea rows={2} value={form.spaceNotes} onChange={(e) => set("spaceNotes", e.target.value)} className="input" />
        </Field>
      </fieldset>

      <fieldset id="s9" className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-xs font-medium tracking-wide text-foreground/50 uppercase">Guest logistics and support</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Direct flight from Amsterdam to the nearest airport">
            <select value={form.directFlightAmsterdam} onChange={(e) => set("directFlightAmsterdam", e.target.value as TriState)} className="input">
              {TRI_STATES.map((value) => (
                <option key={value} value={value}>
                  {TRI_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="English-speaking planning support and day-of staff">
            <select value={form.englishSupport} onChange={(e) => set("englishSupport", e.target.value as EnglishSupport)} className="input">
              {ENGLISH_SUPPORT.map((value) => (
                <option key={value} value={value}>
                  {ENGLISH_SUPPORT_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Transfers, airports and travel from Dublin, Paris, Cádiz">
          <textarea rows={2} value={form.logisticsNotes} onChange={(e) => set("logisticsNotes", e.target.value)} className="input" />
        </Field>
      </fieldset>

      <fieldset id="s11" className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-xs font-medium tracking-wide text-foreground/50 uppercase">Dog policy</legend>
        <div className="grid gap-3 sm:grid-cols-[12rem_12rem_1fr]">
          <Field label="Dogs at the wedding">
            <select aria-label="Dogs at the wedding" value={form.dogPolicy} onChange={(e) => set("dogPolicy", e.target.value as DogPolicy)} className="input">
              {DOG_POLICIES.map((value) => (
                <option key={value} value={value}>
                  {DOG_POLICY_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dogs in accommodation">
            <select aria-label="Dogs in accommodation" value={form.dogAccommodation} onChange={(e) => set("dogAccommodation", e.target.value as DogPolicy)} className="input">
              {DOG_POLICIES.map((value) => (
                <option key={value} value={value}>
                  {DOG_POLICY_LABELS[value]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Conditions and what's confirmed">
            <input value={form.dogNotes} onChange={(e) => set("dogNotes", e.target.value)} className="input" placeholder="e.g. ceremony and photos only; €30 per night; aperitif not confirmed" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <legend className="px-1 text-xs font-medium tracking-wide text-foreground/50 uppercase">How sure are we? (key facts)</legend>
        <p className="text-xs text-foreground/50">
          Only facts that already have a value matter here. Leave &ldquo;Not recorded&rdquo; if you don&apos;t know where it came
          from; it counts as unknown.
        </p>
        {KEY_FACTS.map((fact) => {
          const current = meta[fact.key];
          return (
            <div key={fact.key} className="grid items-center gap-2 text-sm sm:grid-cols-[10rem_14rem_1fr_9rem]">
              <span className="text-ink">{fact.label}</span>
              <select
                aria-label={`${fact.label} confidence`}
                value={current?.confidence ?? ""}
                onChange={(e) => setFact(fact.key, e.target.value === "" ? null : { confidence: e.target.value as Confidence })}
                className="input !px-2 !py-1 text-xs"
              >
                <option value="">Not recorded</option>
                {CONFIDENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {CONFIDENCE_LABELS[level]}
                  </option>
                ))}
              </select>
              <input
                aria-label={`${fact.label} source`}
                value={current?.source ?? ""}
                disabled={!current}
                onChange={(e) => setFact(fact.key, { source: toText(e.target.value) })}
                placeholder="Source (e.g. email from Paula)"
                className="input !px-2 !py-1 text-xs"
              />
              <input
                aria-label={`${fact.label} date`}
                type="date"
                value={current?.date ?? ""}
                disabled={!current}
                onChange={(e) => setFact(fact.key, { date: e.target.value === "" ? null : e.target.value })}
                className="input !px-2 !py-1 text-xs"
              />
            </div>
          );
        })}
      </fieldset>

      <fieldset id="s15" className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <legend className="px-1 text-xs font-medium tracking-wide text-foreground/50 uppercase">Our own outstanding questions</legend>
        <p className="text-xs text-foreground/50">One per line. The dashboard also adds questions automatically from anything still unknown.</p>
        <textarea rows={3} value={form.outstandingQuestions} onChange={(e) => set("outstandingQuestions", e.target.value)} className="input" />
      </fieldset>

      <SaveBar pending={pending} dirtyCount={dirty ? 1 : 0} onSave={save} message={result.message} error={result.error} label="Save venue facts" />
    </div>
  );
}
