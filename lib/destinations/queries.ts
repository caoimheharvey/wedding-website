import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockGetDestinationById, mockListDestinations } from "./mock-store";
import type { Destination } from "./types";

interface DestinationRow {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  estimated_cost: number | null;
  travel_notes: string | null;
  guest_capacity_notes: string | null;
  pros: string | null;
  cons: string | null;
  notes: string | null;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
}

function mapRow(row: DestinationRow): Destination {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    description: row.description,
    estimatedCost: row.estimated_cost,
    travelNotes: row.travel_notes,
    guestCapacityNotes: row.guest_capacity_notes,
    pros: row.pros,
    cons: row.cons,
    notes: row.notes,
    isSelected: row.is_selected,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDestinations(): Promise<Destination[]> {
  if (isLocalTestMode()) return mockListDestinations();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load destinations: ${error.message}`);
  return (data as DestinationRow[]).map(mapRow);
}

export async function getDestinationById(destinationId: string): Promise<Destination | null> {
  if (isLocalTestMode()) return mockGetDestinationById(destinationId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("id", destinationId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load destination: ${error.message}`);
  return data ? mapRow(data as DestinationRow) : null;
}
