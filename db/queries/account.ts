import { eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  eventAttendeesTable,
  eventNotesTable,
  eventsTable,
  groupMemberPhotosTable,
  groupMembersTable,
  groupsTable,
  membersTable,
  messagesTable,
  notificationsTable,
} from "@/db/schema";

export async function setMemberAccountPaused(userId: string, paused: boolean) {
  await db
    .update(membersTable)
    .set({ accountPausedAt: paused ? new Date() : null })
    .where(eq(membersTable.userId, userId));
}

export async function setMemberAccountCanceled(userId: string) {
  await db
    .update(membersTable)
    .set({ accountCanceledAt: new Date() })
    .where(eq(membersTable.userId, userId));
}

/** Clear pause and cancel after the member subscribes again. */
export async function clearMemberAccountClosure(userId: string) {
  await db
    .update(membersTable)
    .set({
      accountPausedAt: null,
      accountCanceledAt: null,
    })
    .where(eq(membersTable.userId, userId));
}

/**
 * Remove this member's LetsMeet data.
 * Groups they own are deleted. Events they organize in someone else's group
 * are handed to that group's owner.
 */
export async function deleteMemberAccountData(userId: string) {
  const organizedEvents = await db
    .select({ id: eventsTable.id, groupId: eventsTable.groupId })
    .from(eventsTable)
    .where(eq(eventsTable.organizerId, userId));

  if (organizedEvents.length > 0) {
    const groupIds = [...new Set(organizedEvents.map((event) => event.groupId))];
    const groups = await db
      .select({ id: groupsTable.id, ownerId: groupsTable.ownerId })
      .from(groupsTable)
      .where(inArray(groupsTable.id, groupIds));
    const ownerByGroupId = new Map(groups.map((group) => [group.id, group.ownerId]));

    for (const event of organizedEvents) {
      const ownerId = ownerByGroupId.get(event.groupId);
      if (!ownerId || ownerId === userId) continue;
      await db
        .update(eventsTable)
        .set({ organizerId: ownerId, updatedAt: new Date() })
        .where(eq(eventsTable.id, event.id));
    }
  }

  await db.delete(groupsTable).where(eq(groupsTable.ownerId, userId));
  await db.delete(groupMembersTable).where(eq(groupMembersTable.userId, userId));
  await db.delete(groupMemberPhotosTable).where(eq(groupMemberPhotosTable.userId, userId));
  await db.delete(eventAttendeesTable).where(eq(eventAttendeesTable.userId, userId));
  await db.delete(eventNotesTable).where(eq(eventNotesTable.userId, userId));
  await db
    .delete(messagesTable)
    .where(
      or(eq(messagesTable.senderUserId, userId), eq(messagesTable.recipientUserId, userId))
    );
  await db.delete(notificationsTable).where(eq(notificationsTable.userId, userId));
  await db.delete(membersTable).where(eq(membersTable.userId, userId));
}
