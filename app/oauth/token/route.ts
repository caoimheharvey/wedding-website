import { NextResponse } from "next/server";
import {
  CORS_HEADERS,
  oauthConfigured,
  pkceMatches,
  readClient,
  resourceUrl,
  signToken,
  siteOrigin,
  TTL,
  verifyToken,
} from "@/lib/mcp/oauth";

const HEADERS = { ...CORS_HEADERS, "Cache-Control": "no-store" };

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: HEADERS });

export async function POST(request: Request) {
  if (!oauthConfigured()) return fail("server_error", 503);

  const form = await request.formData().catch(() => null);
  const field = (name: string) => {
    const value = form?.get(name);
    return typeof value === "string" ? value : "";
  };

  const client = await readClient(field("client_id"));
  if (!client) return fail("invalid_client", 401);

  let subject: string;
  const grantType = field("grant_type");

  if (grantType === "authorization_code") {
    const code = await verifyToken(field("code"), "code");
    if (
      !code ||
      code.client_id !== client.clientId ||
      code.redirect_uri !== field("redirect_uri") ||
      typeof code.code_challenge !== "string" ||
      !field("code_verifier") ||
      !pkceMatches(field("code_verifier"), code.code_challenge)
    ) {
      return fail("invalid_grant");
    }
    subject = String(code.sub);
  } else if (grantType === "refresh_token") {
    const refresh = await verifyToken(field("refresh_token"), "refresh");
    if (!refresh || refresh.client_id !== client.clientId) return fail("invalid_grant");
    subject = String(refresh.sub);
  } else {
    return fail("unsupported_grant_type");
  }

  const audience = resourceUrl(siteOrigin(request));
  const [accessToken, refreshToken] = await Promise.all([
    signToken("access", { sub: subject, aud: audience, client_id: client.clientId }, TTL.access),
    signToken("refresh", { sub: subject, client_id: client.clientId }, TTL.refresh),
  ]);

  return NextResponse.json(
    {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: TTL.access,
      refresh_token: refreshToken,
      scope: "mcp",
    },
    { headers: HEADERS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
