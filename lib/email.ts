import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APPROVAL_RECIPIENT = "jacqueline@letsmeet.uk";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "LetsMeet <onboarding@resend.dev>";

export type NewGroupDetails = {
  id: number;
  name: string;
  description: string | null;
  city: string;
  ownerId: string;
};

/**
 * Sends an email to the approval recipient with new group details.
 * Does not throw; logs errors so group creation can still succeed.
 */
export async function sendNewGroupApprovalEmail(group: NewGroupDetails): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set; skipping approval email.");
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [APPROVAL_RECIPIENT],
      subject: `[LetsMeet] New group for approval: ${group.name}`,
      html: `
        <h2>New group submitted for approval</h2>
        <p><strong>Name:</strong> ${escapeHtml(group.name)}</p>
        <p><strong>City:</strong> ${escapeHtml(group.city)}</p>
        <p><strong>Description:</strong></p>
        <p>${group.description ? escapeHtml(group.description) : "(none)"}</p>
        <p><strong>Group ID:</strong> ${group.id}</p>
        <p><strong>Owner ID (Clerk):</strong> ${escapeHtml(group.ownerId)}</p>
      `.replace(/\n\s+/g, "\n").trim(),
    });

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send approval email:", err);
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
