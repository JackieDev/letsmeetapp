const DEFAULT_PRIMARY_ORIGIN = "https://letsmeet.uk";

export const ACCOUNTS_HOST = "accounts.letsmeet.uk";

export function getPrimaryAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  return DEFAULT_PRIMARY_ORIGIN;
}
