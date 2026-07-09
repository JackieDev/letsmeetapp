export const APPROVAL_RECIPIENT = "jacqueline@letsmeet.uk";

const DEFAULT_FROM_EMAIL = "LetsMeet <noreply@letsmeet.uk>";

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_EMAIL;
}

import { getRuntimeSecretDiagnostic } from "@/lib/server-secrets";

export function getEmailConfigDiagnostic() {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const runtime = getRuntimeSecretDiagnostic();

  return {
    resendApiKeyConfigured: apiKey.length > 0,
    resendApiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : null,
    resendApiKeySource: runtime.resendApiKeySource,
    fromEmail: getFromEmail(),
    approvalRecipient: APPROVAL_RECIPIENT,
    fromUsesLetsmeetDomain: getFromEmail().includes("@letsmeet.uk"),
    runtime,
    notes: [
      "Amplify secrets are available at build time; SSR needs them again at runtime.",
      "If resendApiKeyConfigured is false here, emails are skipped before Resend is called.",
      "Grant the Amplify compute role ssm:GetParameter on arn:...:parameter/amplify/*.",
      "letsmeet.uk must be verified for sending in the Resend dashboard (SPF + DKIM).",
    ],
  };
}
