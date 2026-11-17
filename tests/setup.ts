import { vi } from "vitest";

// The app talks to Supabase through getSupabaseAdmin(); tests install a PGlite
// backed fake on globalThis and the real code paths run against it.
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseAdmin: () => {
    const client = (globalThis as { __fakeSupabase?: unknown }).__fakeSupabase;
    if (!client) throw new Error("No test database: call withTestDatabase() first");
    return client;
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("@/lib/dal", () => ({ requireAdmin: async () => ({ email: "admin@example.com", name: "Test Admin" }) }));

// Never let a developer's .env.local switch the app into its in-memory mock mode.
delete process.env.LOCAL_TEST_BYPASS_AUTH;
