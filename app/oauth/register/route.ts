import { NextResponse } from "next/server";
import { CORS_HEADERS, isAllowedRedirect, oauthConfigured, signToken } from "@/lib/mcp/oauth";

// Dynamic client registration. Open by design (the client can't be known in
// advance), so the real gates are the redirect allowlist and the admin
// having to approve every authorization on the consent screen.
export async function POST(request: Request) {
  if (!oauthConfigured()) {
    return NextResponse.json({ error: "server_error" }, { status: 503, headers: CORS_HEADERS });
  }

  const body = (await request.json().catch(() => null)) as {
    redirect_uris?: unknown;
    client_name?: unknown;
  } | null;
  const uris = body?.redirect_uris;
  if (
    !Array.isArray(uris) ||
    uris.length === 0 ||
    uris.length > 10 ||
    !uris.every((uri) => typeof uri === "string" && isAllowedRedirect(uri))
  ) {
    return NextResponse.json(
      { error: "invalid_redirect_uri", error_description: "Redirect URI is not allowed." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const clientName =
    typeof body?.client_name === "string" ? body.client_name.slice(0, 80) : "MCP client";
  const clientId = await signToken("client", { redirect_uris: uris, client_name: clientName });

  return NextResponse.json(
    {
      client_id: clientId,
      client_name: clientName,
      redirect_uris: uris,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    { status: 201, headers: CORS_HEADERS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
