export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadAwsSecretsIntoEnv } = await import("@/lib/server-secrets");
    await loadAwsSecretsIntoEnv();
  }
}
