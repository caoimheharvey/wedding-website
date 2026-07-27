import "server-only";
import { auth } from "@/lib/auth";
import { isLocalTestMode, LOCAL_TEST_USER } from "@/lib/local-test";

/**
 * Defense-in-depth check for Server Actions and Route Handlers, which are
 * reachable directly and not solely protected by proxy.ts.
 */
export async function requireAdmin() {
  if (isLocalTestMode()) return LOCAL_TEST_USER;

  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}
