import { redirect } from "next/navigation";

// Guest sign-in now lives at "/" — keep this route for old links and redirects.
export default async function GuestSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const query = error ? `?error=${encodeURIComponent(error)}` : "";
  redirect(`/${query}`);
}
