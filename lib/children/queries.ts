import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { mockListChildren, mockListChildrenForGuest } from "./mock-store";
import type { GuestChild } from "./types";

interface GuestChildRow {
  id: string;
  guest_id: string;
  first_name: string;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: GuestChildRow): GuestChild {
  return {
    id: row.id,
    guestId: row.guest_id,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listChildren(): Promise<GuestChild[]> {
  if (isLocalTestMode()) return mockListChildren();

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("guest_children")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load children: ${error.message}`);
  return (data as GuestChildRow[]).map(mapRow);
}

export async function listChildrenForGuest(guestId: string): Promise<GuestChild[]> {
  if (isLocalTestMode()) return mockListChildrenForGuest(guestId);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("guest_children")
    .select("*")
    .eq("guest_id", guestId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load children: ${error.message}`);
  return (data as GuestChildRow[]).map(mapRow);
}
