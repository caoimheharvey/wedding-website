import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Service-role Supabase client for trusted server code (Server Actions,
 * Route Handlers). Never import this from a Client Component. Lazily
 * created so a missing Supabase project doesn't break `next build`.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
  }

  client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}
