"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { diffVenueFields } from "./changes";
import {
  mockAddVenueDocument,
  mockAddVenueUpdate,
  mockDeleteVenueDocument,
  mockGetVenueDetails,
  mockSaveVenueDetails,
} from "./mock-store";
import { getVenueDetails } from "./queries";
import { venueFieldsToRow } from "./rows";
import { toVenueFields, venueDetailsFormSchema, venueUpdateMetaSchema } from "./schema";

export type VenueDetailsActionState =
  | { errors: Record<string, string[] | undefined>; message?: string }
  | { errors?: undefined; message?: string }
  | undefined;

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

function revalidateVenue(category: string, vendorId: string) {
  revalidatePath(`/admin/vendors/${category}`);
  revalidatePath(`/admin/vendors/${category}/${vendorId}/edit`);
}

export async function saveVenueDetails(
  vendorId: string,
  category: string,
  _prevState: VenueDetailsActionState,
  formData: FormData,
): Promise<VenueDetailsActionState> {
  await requireAdmin();

  const raw = Object.fromEntries(formData);
  const parsed = venueDetailsFormSchema.safeParse(raw);
  const meta = venueUpdateMetaSchema.safeParse(raw);
  if (!parsed.success) return { errors: z.flattenError(parsed.error).fieldErrors };
  if (!meta.success) return { errors: z.flattenError(meta.error).fieldErrors };

  const fields = toVenueFields(parsed.data);
  const previous = isLocalTestMode() ? mockGetVenueDetails(vendorId) : await getVenueDetails(vendorId);
  const changes = diffVenueFields(previous, fields);
  const rawText = meta.data.updateText || null;

  // Nothing new said and nothing changed: don't add an empty log entry.
  if (changes.length === 0 && !rawText) return { message: "Nothing to save — no changes or notes." };

  const entry = {
    kind: meta.data.updateKind,
    occurredOn: meta.data.updateDate,
    rawText,
    changes,
  };

  if (isLocalTestMode()) {
    mockSaveVenueDetails(vendorId, fields);
    mockAddVenueUpdate({ vendorId, ...entry });
  } else {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("venue_details").upsert(venueFieldsToRow(vendorId, fields));
    if (error) return { message: `Could not save venue details: ${error.message}` };
    const { error: updateError } = await supabase.from("venue_updates").insert({
      vendor_id: vendorId,
      kind: entry.kind,
      occurred_on: entry.occurredOn,
      raw_text: entry.rawText,
      changes: entry.changes,
    });
    if (updateError) return { message: `Saved details, but not the history entry: ${updateError.message}` };
  }

  revalidateVenue(category, vendorId);
  return {
    message:
      changes.length > 0
        ? `Saved — ${changes.length} field${changes.length === 1 ? "" : "s"} updated.`
        : "Saved to the history.",
  };
}

export async function uploadVenueDocument(
  vendorId: string,
  category: string,
  _prevState: VenueDetailsActionState,
  formData: FormData,
): Promise<VenueDetailsActionState> {
  await requireAdmin();

  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) return { message: "Choose a file to upload." };
  if (file.size > MAX_DOCUMENT_BYTES) return { message: "Files must be under 10MB." };

  if (isLocalTestMode()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`;
    mockAddVenueDocument(vendorId, file.name, url);
  } else {
    const supabase = getSupabaseAdmin();
    const safeName = file.name.replace(/[^\w.\- ]+/g, "_");
    const path = `${vendorId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("venue-documents")
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) return { message: `Could not upload file: ${uploadError.message}` };

    const { error } = await supabase
      .from("venue_documents")
      .insert({ vendor_id: vendorId, file_name: file.name, storage_path: path });
    if (error) {
      await supabase.storage.from("venue-documents").remove([path]);
      return { message: `Could not save file: ${error.message}` };
    }
  }

  revalidateVenue(category, vendorId);
  return { message: `Uploaded ${file.name}.` };
}

export async function deleteVenueDocument(
  documentId: string,
  vendorId: string,
  category: string,
): Promise<{ message?: string }> {
  await requireAdmin();

  if (isLocalTestMode()) {
    mockDeleteVenueDocument(documentId);
  } else {
    const supabase = getSupabaseAdmin();
    const { data, error: lookupError } = await supabase
      .from("venue_documents")
      .select("storage_path")
      .eq("id", documentId)
      .maybeSingle();
    if (lookupError) return { message: `Could not delete file: ${lookupError.message}` };

    const { error } = await supabase.from("venue_documents").delete().eq("id", documentId);
    if (error) return { message: `Could not delete file: ${error.message}` };
    if (data?.storage_path) {
      await supabase.storage.from("venue-documents").remove([data.storage_path]);
    }
  }

  revalidateVenue(category, vendorId);
  return {};
}
