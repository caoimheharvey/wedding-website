/**
 * Google refuses to render most links guests/admins actually copy (a
 * "/maps/place/..." page, an "@lat,lng" view, a "?q=..." search) inside an
 * iframe — only the "output=embed" form is allowed. This converts what was
 * naturally pasted into an embeddable URL without needing an API key or the
 * "Embed a map" HTML snippet from Google's share sheet.
 */
export function toGoogleMapsEmbedUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (trimmed.includes("/maps/embed") || /[?&]output=embed\b/.test(trimmed)) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/]+)/);
  if (placeMatch) {
    const place = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    return `https://maps.google.com/maps?q=${encodeURIComponent(place)}&output=embed`;
  }

  const coordMatch = parsed.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (coordMatch) {
    const [, lat, lng] = coordMatch;
    return `https://maps.google.com/maps?q=${lat},${lng}&output=embed`;
  }

  const query = parsed.searchParams.get("q") ?? parsed.searchParams.get("query");
  if (query) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  }

  const searchMatch = parsed.pathname.match(/\/maps\/search\/([^/]+)/);
  if (searchMatch) {
    const search = decodeURIComponent(searchMatch[1].replace(/\+/g, " "));
    return `https://maps.google.com/maps?q=${encodeURIComponent(search)}&output=embed`;
  }

  return trimmed;
}
