import { redirect } from "next/navigation";

// The guest experience now lives at "/" — this route just forwards old
// links/bookmarks (including role/lang preview query params) there.
export default async function GuestRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") query.set(key, value);
  }
  const queryString = query.toString();
  redirect(queryString ? `/?${queryString}` : "/");
}
