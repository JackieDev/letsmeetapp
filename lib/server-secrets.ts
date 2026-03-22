import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

/**
 * Keys merged from the AWS Secrets Manager JSON payload into `process.env`.
 * Use the same names in your secret (e.g. `letsmeet/production` in AWS).
 */
const SECRET_ENV_KEYS = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
] as const;

/**
 * In production, when `AWS_SECRETS_ID` is set, fetches the secret string (JSON object)
 * and copies supported keys into `process.env` so existing code keeps using `process.env.*`.
 *
 * Call this from `instrumentation.ts` so it runs once when the Node server starts (before
 * handling requests). IAM must allow `secretsmanager:GetSecretValue` on the secret.
 *
 * Edge middleware and the client bundle do not run this hook; set
 * `NEXT_PUBLIC_*` / `CLERK_*` at build time or via your host’s env if needed there.
 */
export async function loadAwsSecretsIntoEnv(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const secretId = process.env.AWS_SECRETS_ID;
  if (!secretId) {
    return;
  }

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
      process.env[key] = value;
    }
  }
}
