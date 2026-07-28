import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyGuestLoginToken } from "@/lib/guest-auth/actions";
import { createGuestSession } from "@/lib/guest-auth/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/?error=missing-token", request.url));
  }

  const guestId = await verifyGuestLoginToken(token);
  if (!guestId) {
    return NextResponse.redirect(new URL("/?error=invalid-token", request.url));
  }

  await createGuestSession(guestId);
  return NextResponse.redirect(new URL("/", request.url));
}
