import "server-only";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isLocalTestMode } from "@/lib/local-test";
import { configuredSiteOrigin } from "@/lib/site-url";

// 9 random bytes = 12 URL-safe characters (72 bits): short enough to keep an
// SMS to one or two segments, far too many combinations to guess.
const TOKEN_BYTES = 9;

const mockTokens = new Map<string, string>(); // guestId -> token (local test mode only)

const newToken = () => randomBytes(TOKEN_BYTES).toString("base64url");

export function inviteUrl(origin: string, token: string): string {
  return `${origin}/i/${token}`;
}

/** The public site origin to build links from; falls back to the host the admin is using. */
export function inviteOrigin(fallbackOrigin: string): string {
  return configuredSiteOrigin() ?? fallbackOrigin;
}

/** The guest's personal token, created the first time they are sent a link and kept after that. */
export async function ensureInviteTokens(guestIds: string[]): Promise<Map<string, string>> {
  const tokens = new Map<string, string>();
  if (guestIds.length === 0) return tokens;

  if (isLocalTestMode()) {
    for (const id of guestIds) {
      if (!mockTokens.has(id)) mockTokens.set(id, newToken());
      tokens.set(id, mockTokens.get(id)!);
    }
    return tokens;
  }

  const supabase = getSupabaseAdmin();
  const load = async () => {
    const { data, error } = await supabase.from("guest_invite_links").select("guest_id, token").in("guest_id", guestIds);
    if (error) throw new Error(`Failed to load invite links: ${error.message}`);
    for (const row of data as { guest_id: string; token: string }[]) tokens.set(row.guest_id, row.token);
  };

  await load();
  const missing = guestIds.filter((id) => !tokens.has(id));
  if (missing.length > 0) {
    const { error } = await supabase
      .from("guest_invite_links")
      .insert(missing.map((guestId) => ({ guest_id: guestId, token: newToken() })));
    // A concurrent send may have created some of them first; read back whatever won.
    if (error) console.warn(`Invite link insert raced or failed: ${error.message}`);
    await load();
  }

  const stillMissing = guestIds.filter((id) => !tokens.has(id));
  if (stillMissing.length > 0) throw new Error("Could not create personal links for every recipient.");
  return tokens;
}

/** The guest a personal link belongs to, or null when the token is unknown or has been revoked. */
export async function guestIdForInviteToken(token: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return null;

  if (isLocalTestMode()) {
    for (const [guestId, value] of mockTokens) if (value === token) return guestId;
    return null;
  }

  const { data, error } = await getSupabaseAdmin()
    .from("guest_invite_links")
    .select("guest_id")
    .eq("token", token)
    .maybeSingle();
  if (error) throw new Error(`Failed to look up invite link: ${error.message}`);
  return data ? (data as { guest_id: string }).guest_id : null;
}
