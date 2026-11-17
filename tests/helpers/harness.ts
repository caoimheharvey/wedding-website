import type { PGlite } from "@electric-sql/pglite";
import { beforeAll } from "vitest";
import { createDatabase } from "./db";
import { createFakeSupabase } from "./fake-supabase";

export let db: PGlite;

/** Gives the suite a fresh migrated database that the app code reads and writes. */
export function withTestDatabase(upTo?: string) {
  beforeAll(async () => {
    db = await createDatabase(upTo);
    (globalThis as { __fakeSupabase?: unknown }).__fakeSupabase = createFakeSupabase(db);
  });
}

/** Calls an MCP tool exactly as an assistant would, through the real JSON-RPC handler. */
export async function callTool(name: string, args: Record<string, unknown> = {}) {
  const { handleRpc } = await import("@/lib/mcp/server");
  const response = await handleRpc({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
  if (!response || !("result" in response)) throw new Error(`No result from ${name}`);
  const result = response.result as { isError?: boolean; content: { text: string }[] };
  const text = result.content[0].text;
  let data: unknown = text;
  try {
    data = JSON.parse(text);
  } catch {
    // Error messages are plain text.
  }
  return { isError: Boolean(result.isError), text, data: data as Record<string, any> }; // eslint-disable-line @typescript-eslint/no-explicit-any
}
