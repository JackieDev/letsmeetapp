const DEFAULT_PRIMARY_ORIGIN = "https://letsmeet.uk";

export const ACCOUNTS_HOST = "accounts.letsmeet.uk";

export function getPrimaryAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return DEFAULT_PRIMARY_ORIGIN;
}

/** Resolve a Clerk redirect_url to a same-origin path, or null if unsafe. */
export function parseInternalRedirectPath(redirectUrl: string | undefined): string | null {
  if (!redirectUrl) return null;

  try {
    const parsed = redirectUrl.startsWith("/")
      ? new URL(redirectUrl, getPrimaryAppOrigin())
      : new URL(redirectUrl);

    if (parsed.origin !== getPrimaryAppOrigin()) return null;

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}
