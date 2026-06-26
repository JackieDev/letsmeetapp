export type DatabaseUrlSource = "missing" | "build" | "aws-secrets-manager";

export type DatabaseConnectionDiagnostic = {
  configured: boolean;
  host: string | null;
  database: string | null;
  usesPooler: boolean;
  urlSource: DatabaseUrlSource;
  awsSecretsIdConfigured: boolean;
  liveConnection?: {
    ok: boolean;
    databaseName?: string;
    error?: string;
  };
};

export function parseDatabaseUrl(url: string): {
  host: string | null;
  database: string | null;
  usesPooler: boolean;
} {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname || null;
    const database = parsed.pathname.replace(/^\//, "") || null;
    return {
      host,
      database,
      usesPooler: host?.includes("-pooler") ?? false,
    };
  } catch {
    return { host: null, database: null, usesPooler: false };
  }
}

export function getDatabaseConnectionDiagnostic(
  urlSource: DatabaseUrlSource
): DatabaseConnectionDiagnostic {
  const url = process.env.DATABASE_URL;
  const awsSecretsIdConfigured = Boolean(process.env.AWS_SECRETS_ID?.trim());

  if (!url) {
    return {
      configured: false,
      host: null,
      database: null,
      usesPooler: false,
      urlSource: "missing",
      awsSecretsIdConfigured,
    };
  }

  const parsed = parseDatabaseUrl(url);

  return {
    configured: true,
    host: parsed.host,
    database: parsed.database,
    usesPooler: parsed.usesPooler,
    urlSource,
    awsSecretsIdConfigured,
  };
}
