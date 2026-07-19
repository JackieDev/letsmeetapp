import { Resend } from "resend";
import { APPROVAL_RECIPIENT, getFromEmail } from "@/lib/email-diagnostic";

export { APPROVAL_RECIPIENT, getFromEmail } from "@/lib/email-diagnostic";

let resendSingleton: Resend | undefined;

export type EmailSendResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

function getResend(): Resend | undefined {
  const key = process.env.RESEND_API_KEY;
  if (!key) return undefined;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

async function sendEmail(params: {
  to: string[];
  subject: string;
  html: string;
  context: string;
}): Promise<EmailSendResult> {
  if (!process.env.RESEND_API_KEY) {
    const error = "RESEND_API_KEY not set";
    console.warn(`[email] ${error}; skipping ${params.context}.`);
    return { ok: false, error };
  }

  const resend = getResend();
  if (!resend) {
    const error = "Resend client unavailable";
    console.warn(`[email] ${error}; skipping ${params.context}.`);
    return { ok: false, error };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error(`[email] Resend error (${params.context}):`, error);
      return {
        ok: false,
        error: typeof error.message === "string" ? error.message : "Resend send failed",
      };
    }

    console.log(`[email] Sent ${params.context}`, { id: data?.id, to: params.to });
    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error(`[email] Failed ${params.context}:`, err);
    return { ok: false, error: message };
  }
}

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
export async function sendNewGroupApprovalEmail(
  group: NewGroupDetails
): Promise<EmailSendResult> {
  return sendEmail({
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
    context: "group approval email",
  });
}

export type ReportIssueDetails = {
  email: string;
  message: string;
  userName: string | null;
  userId: string | null;
};

/**
 * Sends a "Report an issue" email to the same recipient as group approvals.
 * Does not throw; logs errors so the UI can show a generic message.
 */
export async function sendReportIssueEmail(
  report: ReportIssueDetails
): Promise<EmailSendResult> {
  return sendEmail({
    to: [APPROVAL_RECIPIENT],
    subject: `[LetsMeet] Report an issue from ${escapeHtml(report.email)}`,
    html: `
        <h2>Report an issue</h2>
        <p><strong>From email:</strong> ${escapeHtml(report.email)}</p>
        <p><strong>User name:</strong> ${report.userName ? escapeHtml(report.userName) : "(not signed in)"}</p>
        <p><strong>User ID (Clerk):</strong> ${report.userId ? escapeHtml(report.userId) : "(not signed in)"}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(report.message)}</p>
      `.replace(/\n\s+/g, "\n").trim(),
    context: "report issue email",
  });
}

export type ContactMessageDetails = {
  name: string | null;
  email: string;
  message: string;
  userId: string | null;
};

/**
 * Sends a general contact/support email to the same recipient as group approvals.
 */
export async function sendContactEmail(
  contact: ContactMessageDetails
): Promise<EmailSendResult> {
  return sendEmail({
    to: [APPROVAL_RECIPIENT],
    subject: `[LetsMeet] Contact form from ${escapeHtml(contact.email)}`,
    html: `
        <h2>Contact form message</h2>
        <p><strong>From email:</strong> ${escapeHtml(contact.email)}</p>
        <p><strong>Name:</strong> ${contact.name ? escapeHtml(contact.name) : "(not provided)"}</p>
        <p><strong>User ID (Clerk):</strong> ${contact.userId ? escapeHtml(contact.userId) : "(not signed in)"}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(contact.message)}</p>
      `.replace(/\n\s+/g, "\n").trim(),
    context: "contact form email",
  });
}

export async function sendTestEmail(): Promise<EmailSendResult> {
  return sendEmail({
    to: [APPROVAL_RECIPIENT],
    subject: "[LetsMeet] Email diagnostic test",
    html: `
        <h2>LetsMeet email test</h2>
        <p>If you received this, Resend is configured and delivering to ${escapeHtml(APPROVAL_RECIPIENT)}.</p>
        <p>Sent at: ${escapeHtml(new Date().toISOString())}</p>
      `.replace(/\n\s+/g, "\n").trim(),
    context: "diagnostic test email",
  });
}

export type GroupMemberJoinRequestEmailDetails = {
  toEmail: string;
  requesterName: string;
  requesterId: string;
  groupId: number;
  groupName: string;
  groupCity: string;
};

export type GroupApprovedOwnerEmailDetails = {
  toEmail: string;
  groupName: string;
  groupCity: string;
};

/**
 * Sends an email to the group owner when someone requests to join.
 * Does not throw; logs errors so the join flow can still succeed.
 */
export async function sendGroupMemberJoinRequestEmail(
  details: GroupMemberJoinRequestEmailDetails
): Promise<EmailSendResult> {
  if (!details.toEmail) {
    const error = "Missing toEmail";
    console.warn(`[email] ${error}; skipping join request email.`);
    return { ok: false, error };
  }

  return sendEmail({
    to: [details.toEmail],
    subject: `[LetsMeet] Join request: ${details.groupName}`,
    html: `
        <h2>New join request</h2>
        <p>
          <strong>${escapeHtml(details.requesterName)}</strong>
          wants to join your group
          <strong>${escapeHtml(details.groupName)}</strong>
          (${escapeHtml(details.groupCity)}).
        </p>
        <p><strong>Group ID:</strong> ${details.groupId}</p>
        <p><strong>Requester ID (Clerk):</strong> ${escapeHtml(details.requesterId)}</p>
        <p>
          Open the app to review the request and approve the member.
        </p>
        <p style="color: #666; font-size: 12px;">
          This is an automated email from LetsMeet.
        </p>
      `.replace(/\n\s+/g, "\n").trim(),
    context: "join request email",
  });
}

/**
 * Sends an email to a group owner when their new group has been approved.
 * Does not throw; logs errors so the approval flow can still succeed.
 */
export async function sendGroupApprovedOwnerEmail(
  details: GroupApprovedOwnerEmailDetails
): Promise<EmailSendResult> {
  if (!details.toEmail) {
    const error = "Missing toEmail";
    console.warn(`[email] ${error}; skipping group approved email.`);
    return { ok: false, error };
  }

  return sendEmail({
    to: [details.toEmail],
    subject: `[LetsMeet] Your group was approved: ${details.groupName}`,
    html: `
        <h2>Your group is now live</h2>
        <p>
          Great news - your group
          <strong>${escapeHtml(details.groupName)}</strong>
          (${escapeHtml(details.groupCity)}) has been approved.
        </p>
        <p>
          Other users can now find and join your group.
        </p>
        <p style="color: #666; font-size: 12px;">
          This is an automated email from LetsMeet.
        </p>
      `.replace(/\n\s+/g, "\n").trim(),
    context: "group approved email",
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
