const fs = require("fs");
const { execSync } = require("child_process");

const secretKeys = [
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "DATABASE_URL",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_ID",
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_SLUG",
  "CLERK_WEBHOOK_SIGNING_SECRET",
];

function lookupSecretValue(secretsObj, key) {
  if (typeof secretsObj[key] === "string" && secretsObj[key].length > 0) {
    return secretsObj[key];
  }

  // Some tooling stores keys with a leading dot — unlikely but harmless to check.
  const dotted = `.${key}`;
  if (typeof secretsObj[dotted] === "string" && secretsObj[dotted].length > 0) {
    return secretsObj[dotted];
  }

  // SSM path-style keys: /amplify/app-id/branch/CLERK_SECRET_KEY
  for (const [candidateKey, value] of Object.entries(secretsObj)) {
    if (typeof value !== "string" || value.length === 0) continue;
    if (
      candidateKey === key ||
      candidateKey.endsWith(`/${key}`) ||
      candidateKey.endsWith(`.${key}`)
    ) {
      return value;
    }
  }

  return null;
}

function loadSecretsJson() {
  const raw = process.env.secrets;
  console.log(
    `process.env.secrets present: ${Boolean(raw)}, length: ${raw?.length ?? 0}`
  );

  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed);
      console.log(
        keys.length > 0
          ? `Raw secrets JSON keys: ${keys.join(", ")}`
          : "Raw secrets JSON keys: (empty object)"
      );
      return parsed;
    }
    console.log("Warning: process.env.secrets JSON is not an object");
    return {};
  } catch {
    console.log("Warning: process.env.secrets is not valid JSON");
    return {};
  }
}

function fetchFromSsmParameter(name) {
  try {
    const value = execSync(
      `aws ssm get-parameter --name "${name}" --with-decryption --query Parameter.Value --output text`,
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    ).trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function loadFromSsmFallback() {
  const appId = process.env.AWS_APP_ID;
  const branch = process.env.AWS_BRANCH;
  if (!appId || !branch) {
    console.log(
      "SSM fallback skipped: AWS_APP_ID or AWS_BRANCH not set on build environment"
    );
    return {};
  }

  const paths = [
    `/amplify/${appId}/${branch}`,
    `/amplify/shared/${appId}`,
  ];

  const resolved = {};
  for (const basePath of paths) {
    for (const key of secretKeys) {
      if (resolved[key]) continue;
      const value = fetchFromSsmParameter(`${basePath}/${key}`);
      if (value) {
        resolved[key] = value;
        console.log(`SSM fallback loaded: ${key} from ${basePath}/${key}`);
      }
    }
  }

  return resolved;
}

const fromSecretsJson = loadSecretsJson();
const fromSsmFallback =
  Object.keys(fromSecretsJson).length === 0 ? loadFromSsmFallback() : {};

const resolved = {};
for (const key of secretKeys) {
  const fromJson = lookupSecretValue(fromSecretsJson, key);
  const fromSsm = fromSsmFallback[key];
  const fromEnv = process.env[key];
  const value =
    fromJson ??
    fromSsm ??
    (typeof fromEnv === "string" && fromEnv.length > 0 ? fromEnv : null);
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
    `Missing required keys: ${missingRequired.join(", ")}.\n` +
      "Amplify Hosting Secrets often fail to inject when SSM paths do not match the branch " +
      "(see build log: 'Setting Up SSM Secrets' and SSM params Path).\n" +
      "Fix options:\n" +
      "  1. Amplify Console → Hosting → Environment variables (same key names)\n" +
      "  2. Create SSM params at /amplify/{appId}/{branch}/CLERK_SECRET_KEY\n" +
      "  3. Grant Amplify service role ssm:GetParameter* on arn:...:parameter/amplify/*"
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

const clerkKey = resolved.CLERK_SECRET_KEY ?? "";
console.log(
  `CLERK_SECRET_KEY prefix: ${clerkKey ? clerkKey.slice(0, 8) + "..." : "(missing)"}`
);
