import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/lib/auth";
import { isLocalTestMode } from "@/lib/local-test";

// The second param must be typed as NextFetchEvent (even though it's unused)
// so TS resolves this to the middleware overload of `auth()`, not the
// route-handler one.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const authProxy = auth((req: NextAuthRequest, event: NextFetchEvent) => {
  const isSignInRoute = req.nextUrl.pathname === "/admin/sign-in";

  if (!isSignInRoute && !req.auth) {
    const signInUrl = new URL("/admin/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }
});

// Local test mode is checked before touching `auth()` at all, so no Auth.js
// env vars (AUTH_SECRET, Google client) are needed to bypass sign-in locally.
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  if (isLocalTestMode()) return NextResponse.next();
  return authProxy(req, event);
}

export const config = {
  matcher: ["/admin/:path*"],
};
