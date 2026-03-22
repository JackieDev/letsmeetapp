import { Resend } from "resend";

const APPROVAL_RECIPIENT = "jacqueline@letsmeet.uk";

let resendSingleton: Resend | undefined;

function getResend(): Resend | undefined {
  const key = process.env.RESEND_API_KEY;
  if (!key) return undefined;
  if (!resendSingleton) resendSingleton = new Resend(key);
  return resendSingleton;
}

function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? "jacqueline@letsmeet.uk";
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
export async function sendNewGroupApprovalEmail(group: NewGroupDetails): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set; skipping approval email.");
    return;
  }

  const resend = getResend();
  if (!resend) return;

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
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
export async function sendReportIssueEmail(report: ReportIssueDetails): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set; skipping report issue email.");
    return;
  }

  const resend = getResend();
  if (!resend) return;

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
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
    });

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send report issue email:", err);
  }
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
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set; skipping join request email.");
    return;
  }

  if (!details.toEmail) {
    console.warn("[email] Missing toEmail; skipping join request email.");
    return;
  }

  const resend = getResend();
  if (!resend) return;

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
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
    });

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send join request email:", err);
  }
}

/**
 * Sends an email to a group owner when their new group has been approved.
 * Does not throw; logs errors so the approval flow can still succeed.
 */
export async function sendGroupApprovedOwnerEmail(
  details: GroupApprovedOwnerEmailDetails
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set; skipping group approved email.");
    return;
  }

  if (!details.toEmail) {
    console.warn("[email] Missing toEmail; skipping group approved email.");
    return;
  }

  const resend = getResend();
  if (!resend) return;

  try {
    const { error } = await resend.emails.send({
      from: getFromEmail(),
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
    });

    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send group approved email:", err);
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
