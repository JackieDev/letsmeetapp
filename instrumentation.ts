export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadProductionEnv } = await import("@/lib/load-production-env");
    loadProductionEnv();

    const { loadAwsSecretsIntoEnv } = await import("@/lib/server-secrets");
    await loadAwsSecretsIntoEnv();
  }
}
