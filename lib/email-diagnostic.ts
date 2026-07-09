export const APPROVAL_RECIPIENT = "jacqueline@letsmeet.uk";

const DEFAULT_FROM_EMAIL = "LetsMeet <noreply@letsmeet.uk>";

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_EMAIL;
}

export function getEmailConfigDiagnostic() {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  return {
    resendApiKeyConfigured: apiKey.length > 0,
    resendApiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : null,
    fromEmail: getFromEmail(),
    approvalRecipient: APPROVAL_RECIPIENT,
    fromUsesLetsmeetDomain: getFromEmail().includes("@letsmeet.uk"),
    notes: [
      "Emails are sent via Resend. RESEND_API_KEY must be set in Amplify secrets or AWS Secrets Manager.",
      "letsmeet.uk must be verified for sending in the Resend dashboard (SPF + DKIM).",
      "Check Resend → Emails for delivery status if messages do not arrive in Outlook.",
      "Check Outlook Junk folder; same from/to address can sometimes be filtered.",
    ],
  };
}
