import "server-only";
import { createHash } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

/**
 * Minimal stateless OAuth 2.1 for the MCP endpoint, so clients that can only
 * connect with OAuth (ChatGPT) can be authorised by the signed-in admin.
 * Clients, codes and tokens are all signed JWTs — nothing is stored.
 */
export type TokenType = "client" | "code" | "access" | "refresh";

export const ACCESS_TTL_SECONDS = 60 * 60;
export const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 30;
const CODE_TTL_SECONDS = 5 * 60;
export const TTL: Record<"code" | "access" | "refresh", number> = {
  code: CODE_TTL_SECONDS,
  access: ACCESS_TTL_SECONDS,
  refresh: REFRESH_TTL_SECONDS,
};

const DEFAULT_REDIRECT_HOSTS = "chatgpt.com,openai.com,claude.ai,claude.com,localhost,127.0.0.1";

function signingKey(): Uint8Array | null {
  const base =
    process.env.MCP_OAUTH_SECRET || process.env.AUTH_SECRET || process.env.MCP_ADMIN_TOKEN;
  if (!base) return null;
  return createHash("sha256").update(`mcp-oauth:${base}`).digest();
}

export function oauthConfigured(): boolean {
  return signingKey() !== null;
}

/** Public origin of this site, used for issuer / audience / metadata URLs. */
export function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    // Tolerate a bare host ("example.com"): new URL() would throw on it.
    const withScheme = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
    try {
      return new URL(withScheme).origin;
    } catch {
      // fall through to the request's own origin
    }
  }
  return new URL(request.url).origin;
}

export const resourceUrl = (origin: string) => `${origin}/api/mcp`;

export async function signToken(
  type: TokenType,
  claims: Record<string, unknown>,
  ttlSeconds?: number,
): Promise<string> {
  const key = signingKey();
  if (!key) throw new Error("OAuth is not configured");
  const jwt = new SignJWT({ ...claims, typ: type }).setProtectedHeader({ alg: "HS256" }).setIssuedAt();
  if (ttlSeconds) jwt.setExpirationTime(`${ttlSeconds}s`);
  return jwt.sign(key);
}

export async function verifyToken(
  token: string,
  type: TokenType,
): Promise<Record<string, unknown> | null> {
  const key = signingKey();
  if (!key) return null;
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    return payload.typ === type ? payload : null;
  } catch {
    return null;
  }
}

/** Where a client may send the admin back to — a phishing guard, since registration is open. */
export function isAllowedRedirect(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.hash) return false;

  const hosts = (process.env.MCP_OAUTH_ALLOWED_REDIRECT_HOSTS || DEFAULT_REDIRECT_HOSTS)
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
  const host = url.hostname.toLowerCase();
  const local = host === "localhost" || host === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) return false;
  return hosts.some((entry) => host === entry || host.endsWith(`.${entry}`));
}

export interface OAuthClient {
  clientId: string;
  name: string;
  redirectUris: string[];
}

export async function readClient(clientId: string | null | undefined): Promise<OAuthClient | null> {
  if (!clientId) return null;
  const claims = await verifyToken(clientId, "client");
  if (!claims || !Array.isArray(claims.redirect_uris)) return null;
  return {
    clientId,
    name: typeof claims.client_name === "string" ? claims.client_name : "MCP client",
    redirectUris: claims.redirect_uris as string[],
  };
}

export function pkceMatches(verifier: string, challenge: string): boolean {
  return createHash("sha256").update(verifier).digest("base64url") === challenge;
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, MCP-Protocol-Version",
};

export interface AuthorizeParams {
  clientId?: string;
  redirectUri?: string;
  responseType?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  state?: string;
}

/** Validates an authorization request; an error here must never redirect back to the client. */
export async function validateAuthorizeRequest(
  params: AuthorizeParams,
): Promise<{ ok: true; client: OAuthClient; redirectUri: string; codeChallenge: string } | { ok: false; error: string }> {
  const client = await readClient(params.clientId);
  if (!client) return { ok: false, error: "Unknown or invalid client." };
  if (!params.redirectUri || !client.redirectUris.includes(params.redirectUri) || !isAllowedRedirect(params.redirectUri)) {
    return { ok: false, error: "This redirect address isn't allowed." };
  }
  if (params.responseType !== "code") return { ok: false, error: "Unsupported response type." };
  if (!params.codeChallenge || params.codeChallengeMethod !== "S256") {
    return { ok: false, error: "PKCE (S256) is required." };
  }
  return { ok: true, client, redirectUri: params.redirectUri, codeChallenge: params.codeChallenge };
}
