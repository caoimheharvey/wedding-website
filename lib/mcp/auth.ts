import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { isLocalTestMode } from "@/lib/local-test";
import { oauthConfigured, resourceUrl, siteOrigin, verifyToken } from "./oauth";

const MIN_TOKEN_LENGTH = 32;

const digest = (value: string) => createHash("sha256").update(value).digest();

function isStaticToken(candidate: string): boolean {
  const expected = process.env.MCP_ADMIN_TOKEN;
  if (!expected || expected.length < MIN_TOKEN_LENGTH) return false;
  return timingSafeEqual(digest(candidate), digest(expected));
}

function stillAdmin(email: unknown): boolean {
  if (isLocalTestMode()) return true;
  if (typeof email !== "string") return false;
  return (process.env.ALLOWED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .includes(email.toLowerCase());
}

/**
 * The MCP endpoint has no browser session. It accepts either the shared
 * bearer token (MCP_ADMIN_TOKEN, for Claude Code and similar) or an OAuth
 * access token issued after an admin approved the client (ChatGPT). It fails
 * closed: with neither configured, nothing is authorised. Local test mode
 * does not bypass this.
 */
export async function mcpAuthState(request: Request): Promise<"ok" | "unconfigured" | "denied"> {
  const staticConfigured = (process.env.MCP_ADMIN_TOKEN?.length ?? 0) >= MIN_TOKEN_LENGTH;
  if (!staticConfigured && !oauthConfigured()) return "unconfigured";

  const match = /^Bearer (.+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) return "denied";
  const token = match[1];

  if (isStaticToken(token)) return "ok";

  const claims = await verifyToken(token, "access");
  if (!claims || claims.aud !== resourceUrl(siteOrigin(request))) return "denied";
  return stillAdmin(claims.sub) ? "ok" : "denied";
}
