import "server-only";
import { auth } from "@/lib/auth";
import { isLocalTestMode } from "@/lib/local-test";

/** Whether the current request may use admin guest-view preview routes. */
export async function canPreviewGuestView(): Promise<boolean> {
  if (isLocalTestMode()) return true;
  const session = await auth();
  return Boolean(session?.user);
}
