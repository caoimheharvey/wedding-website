import { NextResponse } from "next/server";
import { mcpAuthState } from "@/lib/mcp/auth";
import { handleRpc } from "@/lib/mcp/server";
import { CORS_HEADERS, siteOrigin } from "@/lib/mcp/oauth";

// Streamable HTTP, stateless: every POST is answered with a plain JSON body.
export async function POST(request: Request) {
  const auth = await mcpAuthState(request);
  if (auth === "unconfigured") {
    return NextResponse.json({ message: "MCP endpoint is not configured" }, { status: 503 });
  }
  if (auth === "denied") {
    return NextResponse.json(
      { message: "Unauthorized" },
      {
        status: 401,
        headers: {
          // Points OAuth-capable clients (ChatGPT) at the authorization server.
          "WWW-Authenticate": `Bearer resource_metadata="${siteOrigin(request)}/.well-known/oauth-protected-resource"`,
          ...CORS_HEADERS,
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 },
    );
  }

  const messages = Array.isArray(body) ? body : [body];
  const responses = (
    await Promise.all(
      messages.map((message) =>
        message && typeof message === "object" && (message as { jsonrpc?: string }).jsonrpc === "2.0"
          ? handleRpc(message as Parameters<typeof handleRpc>[0])
          : { jsonrpc: "2.0" as const, id: null, error: { code: -32600, message: "Invalid Request" } },
      ),
    )
  ).filter((response) => response !== null);

  if (responses.length === 0) return new NextResponse(null, { status: 202 });
  return NextResponse.json(Array.isArray(body) ? responses : responses[0]);
}

export function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: "POST" } });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
