import "server-only";

/**
 * Auth bypass for local development only. Gated on NODE_ENV !== "production"
 * so this can never activate on a deployed environment, even if the env var
 * is set by mistake. Never set LOCAL_TEST_BYPASS_AUTH in Vercel/production.
 */
export function isLocalTestMode(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.LOCAL_TEST_BYPASS_AUTH === "true"
  );
}

export const LOCAL_TEST_USER = {
  email: "local-test@example.com",
  name: "Local Test Admin",
};
