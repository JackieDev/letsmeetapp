export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { loadRuntimeSecretsIntoEnv } = await import("@/lib/server-secrets");
    await loadRuntimeSecretsIntoEnv();
  }
}
