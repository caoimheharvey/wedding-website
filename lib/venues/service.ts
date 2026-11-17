import "server-only";
import * as z from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { diffVenueFields } from "./changes";
import { mockAddVenueUpdate, mockSaveVenueDetails } from "./mock-store";
import { getVenueDetails } from "./queries";
import { venueFieldsToRow } from "./rows";
import {
  emptyVenueFields,
  fieldsToForm,
  toVenueFields,
  venueDetailsFormSchema,
  venueUpdateMetaSchema,
} from "./schema";
import type { UpdateKind, VenueDetails } from "./types";

/** Loosely typed patch: only the keys present are changed; null clears a field. */
export type VenuePatch = Record<string, string | number | boolean | null>;

function toFormValue(value: string | number | boolean | null): string {
  if (value === null) return "";
  if (typeof value === "boolean") return value ? "yes" : "no";
  return String(value);
}

/**
 * Merge a partial update onto the venue's current answers and save it with a
 * history entry, the same way the admin editor does (without the session
 * check). Returns the fields that changed.
 */
export async function patchVenueDetails(
  vendorId: string,
  patch: VenuePatch,
  entry: { kind: UpdateKind; date: string; text?: string },
): Promise<{ changed: string[]; details: VenueDetails | null }> {
  const previous = await getVenueDetails(vendorId);
  const base = fieldsToForm(previous ?? emptyVenueFields());
  const overlay = Object.fromEntries(Object.entries(patch).map(([key, value]) => [key, toFormValue(value)]));

  const parsed = venueDetailsFormSchema.safeParse({ ...base, ...overlay });
  const meta = venueUpdateMetaSchema.safeParse({
    updateKind: entry.kind,
    updateDate: entry.date,
    updateText: entry.text,
  });
  if (!parsed.success || !meta.success) {
    const error = !parsed.success ? parsed.error : (meta as { error: z.ZodError }).error;
    const messages = Object.entries(z.flattenError(error).fieldErrors)
      .map(([field, errors]) => `${field}: ${(errors as string[]).join(", ")}`)
      .join("; ");
    throw new Error(messages);
  }

  const fields = toVenueFields(parsed.data);
  const changes = diffVenueFields(previous, fields);
  const rawText = meta.data.updateText || null;

  if (changes.length > 0 || rawText) {
    const log = { kind: meta.data.updateKind, occurredOn: meta.data.updateDate, rawText, changes };
    if (isLocalTestMode()) {
      mockSaveVenueDetails(vendorId, fields);
      mockAddVenueUpdate({ vendorId, ...log });
    } else {
      const supabase = getSupabaseAdmin();
      const { error } = await supabase.from("venue_details").upsert(venueFieldsToRow(vendorId, fields));
      if (error) throw new Error(`Could not save venue details: ${error.message}`);
      const { error: logError } = await supabase.from("venue_updates").insert({
        vendor_id: vendorId,
        kind: log.kind,
        occurred_on: log.occurredOn,
        raw_text: log.rawText,
        changes: log.changes,
      });
      if (logError) throw new Error(`Saved details, but not the history entry: ${logError.message}`);
    }
  }

  return {
    changed: changes.map((change) => change.label),
    details: await getVenueDetails(vendorId),
  };
}
