import { NextResponse } from "next/server";
import { createGuestSession } from "@/lib/guest-auth/session";
import { guestIdForInviteToken } from "@/lib/guest-auth/invite";
import { getGuestById } from "@/lib/guests/queries";
import { configuredSiteOrigin } from "@/lib/site-url";

/**
 * A guest's personal link from an email or text: signs them in and sends them
 * to the site. An unknown or revoked link just lands on the normal sign-in page.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const home = new URL("/", configuredSiteOrigin() ?? request.url);

  const guestId = await guestIdForInviteToken(token);
  const guest = guestId ? await getGuestById(guestId) : null;
  if (guest) await createGuestSession(guest.id);

  const response = NextResponse.redirect(home);
  // The URL carries a credential, so keep it out of referrers and caches.
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("Cache-Control", "no-store");
  return response;
}
