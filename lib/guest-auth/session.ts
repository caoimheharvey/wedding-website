import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isLocalTestMode } from "@/lib/local-test";

const COOKIE_NAME = "guest_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface GuestSessionPayload {
  guestId: string;
}

function getSecretKey(): Uint8Array {
  // Reuses AUTH_SECRET (already required for admin auth) rather than adding
  // a second required secret for a single-couple site. In local test mode,
  // fall back to a fixed dev-only value so "LOCAL_TEST_BYPASS_AUTH=true and
  // nothing else" (per the README) still lets the real guest-auth flow be
  // exercised without extra setup.
  const secret = process.env.AUTH_SECRET ?? (isLocalTestMode() ? "local-test-only-insecure-secret" : undefined);
  if (!secret) {
    throw new Error("Missing AUTH_SECRET environment variable");
  }
  return new TextEncoder().encode(secret);
}

export async function createGuestSession(
  guestId: string,
  durationMs: number = SESSION_DURATION_MS,
): Promise<void> {
  const expiresAt = new Date(Date.now() + durationMs);
  const token = await new SignJWT({ guestId } satisfies GuestSessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getGuestSession(): Promise<GuestSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    if (typeof payload.guestId !== "string") return null;
    return { guestId: payload.guestId };
  } catch {
    return null;
  }
}

export async function deleteGuestSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
