/**
 * Hourly cron: call the Next.js API that emails owners of newly approved groups.
 */
export const handler = async (): Promise<void> => {
  const appUrl = (process.env.APP_URL ?? "https://letsmeet.uk").replace(/\/$/, "");
  const cronSecret = process.env.CRON_SECRET?.trim();

  if (!cronSecret) {
    console.error("[notify-group-approvals] CRON_SECRET is not configured");
    return;
  }

  const url = `${appUrl}/api/cron/notify-group-approvals`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  const body = await response.text();
  if (!response.ok) {
    console.error(
      `[notify-group-approvals] Request failed: ${response.status} ${body}`
    );
    throw new Error(`notify-group-approvals cron failed with status ${response.status}`);
  }

  console.log(`[notify-group-approvals] Success: ${body}`);
};
