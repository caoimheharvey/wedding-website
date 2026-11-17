import { NextResponse } from "next/server";
import { CORS_HEADERS, resourceUrl, siteOrigin } from "@/lib/mcp/oauth";

export function GET(request: Request) {
  const origin = siteOrigin(request);
  return NextResponse.json(
    {
      resource: resourceUrl(origin),
      authorization_servers: [origin],
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp"],
    },
    { headers: CORS_HEADERS },
  );
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
