import { clerkClient } from "@clerk/nextjs/server";
import {
  getGroupsPendingApprovalNotification,
  markGroupApprovalNotified,
} from "@/db/queries/groups";
import { sendGroupApprovedOwnerEmail } from "@/lib/email";

export type NotifyGroupApprovalsResult = {
  processed: number;
  notified: number;
};

/**
 * Emails owners of groups that are approved but not yet notified,
 * then marks each group as notified.
 */
export async function notifyPendingGroupApprovals(): Promise<NotifyGroupApprovalsResult> {
  const groups = await getGroupsPendingApprovalNotification();
  if (groups.length === 0) {
    return { processed: 0, notified: 0 };
  }

  const client = await clerkClient();
  let notified = 0;

  for (const group of groups) {
    const owner = await client.users.getUser(group.ownerId);
    const toEmail = owner.primaryEmailAddress?.emailAddress;

    if (toEmail) {
      await sendGroupApprovedOwnerEmail({
        toEmail,
        groupName: group.name,
        groupCity: group.city,
      });
      notified += 1;
    }

    await markGroupApprovalNotified(group.id);
  }

  return { processed: groups.length, notified };
}
