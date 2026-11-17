import "server-only";
import * as z from "zod";
import { refreshAfterWrite } from "./revalidate";
import { MCP_TOOLS } from "./tools";

const PROTOCOL_VERSION = "2025-03-26";
const SUPPORTED_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

interface RpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export type RpcResponse =
  | { jsonrpc: "2.0"; id: string | number | null; result: unknown }
  | { jsonrpc: "2.0"; id: string | number | null; error: { code: number; message: string } };

const toolDescriptors = MCP_TOOLS.map((tool) => ({
  name: tool.name,
  description: tool.description,
  inputSchema: z.toJSONSchema(tool.input, { io: "input" }),
}));

async function callTool(params: Record<string, unknown> | undefined) {
  const tool = MCP_TOOLS.find((entry) => entry.name === params?.name);
  if (!tool) throw new RpcError(-32602, `Unknown tool: ${String(params?.name)}`);

  const parsed = tool.input.safeParse(params?.arguments ?? {});
  if (!parsed.success) {
    const message = z.prettifyError(parsed.error);
    return { isError: true, content: [{ type: "text", text: `Invalid arguments. ${message}` }] };
  }

  try {
    const result = await tool.run(parsed.data as never);
    refreshAfterWrite(tool.name, parsed.data, result);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool failed.";
    return { isError: true, content: [{ type: "text", text: message }] };
  }
}

class RpcError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

/** Returns null for notifications, which take no response. */
export async function handleRpc(request: RpcRequest): Promise<RpcResponse | null> {
  const isNotification = request.id === undefined;
  const id = request.id ?? null;

  try {
    let result: unknown;
    switch (request.method) {
      case "initialize": {
        const requested = request.params?.protocolVersion;
        result = {
          protocolVersion:
            typeof requested === "string" && SUPPORTED_VERSIONS.includes(requested)
              ? requested
              : PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: "wedding-admin", version: "1.0.0" },
          instructions:
            "Admin tools for the wedding planning site: vendors (including venue reply details) and the planning to-do checklist.",
        };
        break;
      }
      case "ping":
        result = {};
        break;
      case "tools/list":
        result = { tools: toolDescriptors };
        break;
      case "tools/call":
        result = await callTool(request.params);
        break;
      default:
        if (isNotification) return null;
        throw new RpcError(-32601, `Method not found: ${request.method}`);
    }
    return isNotification ? null : { jsonrpc: "2.0", id, result };
  } catch (error) {
    if (isNotification) return null;
    if (error instanceof RpcError) {
      return { jsonrpc: "2.0", id, error: { code: error.code, message: error.message } };
    }
    return { jsonrpc: "2.0", id, error: { code: -32603, message: "Internal error" } };
  }
}
