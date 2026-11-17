/** The public origin from NEXT_PUBLIC_SITE_URL, tolerating a bare host ("example.com"); null when unset or unusable. */
export function configuredSiteOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return null;
  const withScheme = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}
