import { redirect } from "next/navigation";

// Guest sign-in now lives at "/" — keep this route for old links.
export default function GuestSignInPage() {
  redirect("/");
}
