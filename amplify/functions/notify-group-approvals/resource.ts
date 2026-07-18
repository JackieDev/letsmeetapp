import { defineFunction, secret } from "@aws-amplify/backend";

export const notifyGroupApprovals = defineFunction({
  name: "notify-group-approvals",
  entry: "./handler.ts",
  schedule: "every 1h",
  timeoutSeconds: 60,
  environment: {
    APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "https://letsmeet.uk",
    CRON_SECRET: secret("CRON_SECRET"),
  },
});
