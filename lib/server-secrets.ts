import { existsSync } from "node:fs";
import path from "node:path";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { config as loadDotenv } from "dotenv";

/**
 * Keys merged from runtime secret loaders into `process.env`.
 */
const SECRET_ENV_KEYS = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_ID",
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_SLUG",
  "NEXT_PUBLIC_CLERK_BILLING_PLAN_PERIOD",
  "CLERK_WEBHOOK_SIGNING_SECRET",
] as const;

type SecretKey = (typeof SECRET_ENV_KEYS)[number];
type SecretSource = "startup-env" | "env-file" | "amplify-ssm" | "aws-secrets-manager";

let databaseUrlSource: "build" | "aws-secrets-manager" = "build";
const secretSources: Partial<Record<SecretKey, SecretSource>> = {};

function noteStartupEnv(key: SecretKey) {
  if (!secretSources[key] && process.env[key]?.trim()) {
    secretSources[key] = "startup-env";
  }
}

function setEnvFromSource(key: SecretKey, value: string, source: SecretSource) {
  if (!value.trim()) return;
  if (process.env[key]?.trim()) return;
  process.env[key] = value;
  secretSources[key] = source;
  if (key === "DATABASE_URL") {
    databaseUrlSource = source === "aws-secrets-manager" ? "aws-secrets-manager" : "build";
  }
}

/** Where the active `DATABASE_URL` came from for the current server process. */
export function getDatabaseUrlSource(): "build" | "aws-secrets-manager" {
  return databaseUrlSource;
}

export function getRuntimeSecretSources(): Partial<Record<SecretKey, SecretSource>> {
  return { ...secretSources };
}

export function getRuntimeSecretDiagnostic() {
  for (const key of SECRET_ENV_KEYS) {
    noteStartupEnv(key);
  }

  return {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    awsAppId: process.env.AWS_APP_ID ?? null,
    awsBranch: process.env.AWS_BRANCH ?? null,
    awsSecretsIdConfigured: Boolean(process.env.AWS_SECRETS_ID?.trim()),
    resendApiKeyConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    resendApiKeySource: secretSources.RESEND_API_KEY ?? (process.env.RESEND_API_KEY ? "startup-env" : null),
    secretSources,
  };
}

function loadProductionEnvFile(): string | null {
  const candidates = [
    path.join(process.cwd(), ".env.production"),
    path.join(process.cwd(), ".next", "standalone", ".env.production"),
  ];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) continue;
    const result = loadDotenv({ path: envPath, override: false, quiet: true });
    if (result.error) continue;

    for (const key of SECRET_ENV_KEYS) {
      if (process.env[key]?.trim()) {
        secretSources[key] = secretSources[key] ?? "env-file";
      }
    }

    console.log(`[runtime-secrets] Loaded ${envPath}`);
    return envPath;
  }

  return null;
}

async function loadAmplifySsmSecretsIntoEnv(): Promise<void> {
  const appId = process.env.AWS_APP_ID;
  const branch = process.env.AWS_BRANCH;
  if (!appId || !branch) {
    console.log("[runtime-secrets] Amplify SSM skipped: AWS_APP_ID or AWS_BRANCH missing");
    return;
  }

  const client = new SSMClient({ region: process.env.AWS_REGION });
  const basePaths = [`/amplify/${appId}/${branch}`, `/amplify/shared/${appId}`];

  for (const key of SECRET_ENV_KEYS) {
    if (process.env[key]?.trim()) continue;

    for (const basePath of basePaths) {
      try {
        const response = await client.send(
          new GetParameterCommand({
            Name: `${basePath}/${key}`,
            WithDecryption: true,
          })
        );
        const value = response.Parameter?.Value?.trim();
        if (value) {
          setEnvFromSource(key, value, "amplify-ssm");
          console.log(`[runtime-secrets] Loaded ${key} from ${basePath}/${key}`);
          break;
        }
      } catch {
        // Parameter not found or access denied for this path.
      }
    }
  }
}

async function loadAwsSecretsManagerIntoEnv(): Promise<void> {
  const secretId = process.env.AWS_SECRETS_ID?.trim();
  if (!secretId) return;

  const client = new SecretsManagerClient({
    region: process.env.AWS_REGION,
  });

  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretId })
  );

  const secretString = response.SecretString;
  if (!secretString) {
    throw new Error(
      "AWS Secrets Manager returned no SecretString (expected JSON text)."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(secretString);
  } catch {
    throw new Error("AWS secret must be valid JSON (object with string values).");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("AWS secret JSON must be an object.");
  }

  const record = parsed as Record<string, unknown>;
  for (const key of SECRET_ENV_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.length > 0) {
      setEnvFromSource(key, value, "aws-secrets-manager");
    }
  }
}

/**
 * Loads server secrets at runtime for Amplify SSR / standalone deployments.
 *
 * Amplify Hosting secrets are available during build via `process.env.secrets`, but
 * SSR server actions need them again when handling requests. This loader tries, in order:
 * 1. Existing process env
 * 2. `.env.production` written during build
 * 3. Amplify SSM parameters (`/amplify/{appId}/{branch}/{KEY}`)
 * 4. AWS Secrets Manager JSON (`AWS_SECRETS_ID`)
 */
export async function loadRuntimeSecretsIntoEnv(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  for (const key of SECRET_ENV_KEYS) {
    noteStartupEnv(key);
  }

  const envFile = loadProductionEnvFile();
  if (!envFile) {
    console.log("[runtime-secrets] No .env.production file found at runtime");
  }

  try {
    await loadAmplifySsmSecretsIntoEnv();
  } catch (error) {
    console.error("[runtime-secrets] Amplify SSM load failed:", error);
  }

  try {
    await loadAwsSecretsManagerIntoEnv();
  } catch (error) {
    console.error("[runtime-secrets] AWS Secrets Manager load failed:", error);
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    console.log(
      `[runtime-secrets] RESEND_API_KEY ready (source: ${secretSources.RESEND_API_KEY ?? "startup-env"})`
    );
  } else {
    console.warn(
      "[runtime-secrets] RESEND_API_KEY missing at runtime; emails will not be sent."
    );
  }
}

/** @deprecated Use `loadRuntimeSecretsIntoEnv`. */
export async function loadAwsSecretsIntoEnv(): Promise<void> {
  await loadRuntimeSecretsIntoEnv();
}
