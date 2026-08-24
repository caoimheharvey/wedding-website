/**
 * Embed providers (Google Maps, Pinterest, etc.) hand out a full HTML
 * snippet — `<iframe src="...">` or `<a href="...">` — as the "copy this to
 * embed" instructions, and admins naturally paste that whole thing into the
 * URL field. Pull the actual URL out so either a bare link or a pasted
 * snippet works.
 */
export function extractEmbedUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.includes("<")) return trimmed;

  const srcMatch = trimmed.match(/\ssrc=["']([^"']+)["']/i);
  const hrefMatch = trimmed.match(/\shref=["']([^"']+)["']/i);
  const url = srcMatch?.[1] ?? hrefMatch?.[1] ?? trimmed;

  return url.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
