const fs = require("fs");

const secretKeys = [
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "DATABASE_URL",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_ID",
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_SLUG",
  "CLERK_WEBHOOK_SIGNING_SECRET",
];

let fromSecretsJson = {};
try {
  fromSecretsJson = JSON.parse(process.env.secrets || "{}");
} catch {
  console.log("Warning: process.env.secrets is not valid JSON");
}

const resolved = {};
for (const key of secretKeys) {
  const fromJson = fromSecretsJson[key];
  const fromEnv = process.env[key];
  const value =
    typeof fromJson === "string" && fromJson.length > 0
      ? fromJson
      : typeof fromEnv === "string" && fromEnv.length > 0
        ? fromEnv
        : null;
  if (value) resolved[key] = value;
}

const configuredKeys = Object.keys(resolved);
console.log(
  configuredKeys.length > 0
    ? `Configured env keys: ${configuredKeys.join(", ")}`
    : "Configured env keys: (none)"
);

const requiredKeys = ["CLERK_SECRET_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"];
const missingRequired = requiredKeys.filter((key) => !resolved[key]);
if (missingRequired.length > 0) {
  console.error(
    `Missing required keys: ${missingRequired.join(", ")}. ` +
      "Add them in Amplify Console → Hosting → Secrets (or Environment variables)."
  );
  process.exit(1);
}

const lines = Object.entries(resolved).map(
  ([key, value]) => `${key}=${JSON.stringify(value)}`
);

lines.push(
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_PERIOD=annual",
  "AWS_REGION=eu-west-2",
  "NEXT_PUBLIC_APP_URL=https://letsmeet.uk",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL=/",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signed-up",
  "NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/billing",
  "NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/signed-up",
  "NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/billing",
  "NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/signed-up"
);

fs.appendFileSync(".env.production", `${lines.join("\n")}\n`);
console.log("Wrote secrets to .env.production");

const dbUrl = resolved.DATABASE_URL;
if (typeof dbUrl === "string" && dbUrl.length > 0) {
  try {
    console.log(`Build DATABASE host=${new URL(dbUrl).hostname}`);
  } catch {
    console.log("Build DATABASE host=(invalid URL)");
  }
} else {
  console.log("Build DATABASE host=(missing)");
}

console.log(`CLERK_SECRET_KEY=${resolved.CLERK_SECRET_KEY ?? "(missing)"}`);
