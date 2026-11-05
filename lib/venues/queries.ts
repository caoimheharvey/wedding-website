import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import {
  mockGetVenueDetails,
  mockListVenueDetails,
  mockListVenueDocuments,
  mockListVenueUpdates,
} from "./mock-store";
import { mapVenueRow, type VenueDetailsRow } from "./rows";
import type { VenueDetails, VenueDocument, VenueFieldChange, VenueUpdate } from "./types";

const SIGNED_URL_SECONDS = 60 * 60;

export async function listVenueDetails(): Promise<VenueDetails[]> {
  if (isLocalTestMode()) return mockListVenueDetails();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("venue_details").select("*");
  if (error) throw new Error(`Failed to load venue details: ${error.message}`);
  return (data as VenueDetailsRow[]).map(mapVenueRow);
}

export async function getVenueDetails(vendorId: string): Promise<VenueDetails | null> {
  if (isLocalTestMode()) return mockGetVenueDetails(vendorId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("venue_details")
    .select("*")
    .eq("vendor_id", vendorId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load venue details: ${error.message}`);
  return data ? mapVenueRow(data as VenueDetailsRow) : null;
}

export async function listVenueDocuments(vendorId: string): Promise<VenueDocument[]> {
  if (isLocalTestMode()) return mockListVenueDocuments(vendorId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("venue_documents")
    .select("id, vendor_id, file_name, storage_path, created_at")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load venue documents: ${error.message}`);

  const rows = data as {
    id: string;
    vendor_id: string;
    file_name: string;
    storage_path: string;
    created_at: string;
  }[];
  return Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("venue-documents")
        .createSignedUrl(row.storage_path, SIGNED_URL_SECONDS);
      return {
        id: row.id,
        vendorId: row.vendor_id,
        fileName: row.file_name,
        url: signed?.signedUrl ?? "",
        createdAt: row.created_at,
      };
    }),
  );
}

export async function listVenueUpdates(vendorId: string): Promise<VenueUpdate[]> {
  if (isLocalTestMode()) return mockListVenueUpdates(vendorId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("venue_updates")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load venue updates: ${error.message}`);

  return (
    data as {
      id: string;
      vendor_id: string;
      kind: VenueUpdate["kind"];
      occurred_on: string;
      raw_text: string | null;
      changes: VenueFieldChange[];
      created_at: string;
    }[]
  ).map((row) => ({
    id: row.id,
    vendorId: row.vendor_id,
    kind: row.kind,
    occurredOn: row.occurred_on,
    rawText: row.raw_text,
    changes: row.changes ?? [],
    createdAt: row.created_at,
  }));
}
