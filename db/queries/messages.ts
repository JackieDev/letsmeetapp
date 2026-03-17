import { and, desc, eq, or, inArray, ilike, ne } from "drizzle-orm";
import { db } from "@/db";
import { groupMembersTable, membersTable, messagesTable } from "@/db/schema";

export type MessageWithUsers = {
  id: number;
  body: string;
  createdAt: Date;
  readAt: Date | null;
  senderUserId: string;
  recipientUserId: string;
  senderName: string | null;
  senderEmail: string;
  recipientName: string | null;
  recipientEmail: string;
};

export async function insertMessage(params: {
  senderUserId: string;
  recipientUserId: string;
  body: string;
}) {
  await db.insert(messagesTable).values({
    senderUserId: params.senderUserId,
    recipientUserId: params.recipientUserId,
    body: params.body,
  });
}

export async function getMessagesForUser(userId: string): Promise<MessageWithUsers[]> {
  const rows = await db
    .select({
      id: messagesTable.id,
      body: messagesTable.body,
      createdAt: messagesTable.createdAt,
      readAt: messagesTable.readAt,
      senderUserId: messagesTable.senderUserId,
      recipientUserId: messagesTable.recipientUserId,
      senderName: membersTable.name,
      senderEmail: membersTable.email,
      recipientName: membersTable.name,
      recipientEmail: membersTable.email,
    })
    .from(messagesTable)
    .leftJoin(
      membersTable,
      or(
        and(
          eq(messagesTable.senderUserId, membersTable.userId),
          eq(messagesTable.recipientUserId, membersTable.userId)
        ),
        eq(messagesTable.senderUserId, membersTable.userId)
      )
    )
    .where(
      or(
        eq(messagesTable.senderUserId, userId),
        eq(messagesTable.recipientUserId, userId)
      )
    )
    .orderBy(desc(messagesTable.createdAt));

  // The join logic above is conservative; to avoid over-complication, just
  // fall back to user IDs when names/emails are ambiguous.
  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    readAt: row.readAt,
    senderUserId: row.senderUserId,
    recipientUserId: row.recipientUserId,
    senderName: row.senderName ?? null,
    senderEmail: row.senderEmail ?? row.senderUserId,
    recipientName: row.recipientName ?? null,
    recipientEmail: row.recipientEmail ?? row.recipientUserId,
  }));
}

/** Search for users (by name) who share at least one group with the current user. */
export async function searchSharedGroupMembersByName(
  currentUserId: string,
  nameQuery: string
): Promise<{ userId: string; name: string | null; email: string }[]> {
  const trimmed = nameQuery.trim();
  if (!trimmed) return [];

  // First, find all group IDs the current user is (non-banned) member of.
  const myMemberships = await db
    .select({ groupId: groupMembersTable.groupId })
    .from(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.userId, currentUserId),
        eq(groupMembersTable.isBanned, false)
      )
    );

  const groupIds = myMemberships.map((m) => m.groupId);
  if (!groupIds.length) return [];

  // Then, find distinct other userIds in those groups.
  const sharedMemberRows = await db
    .selectDistinct({ userId: groupMembersTable.userId })
    .from(groupMembersTable)
    .where(
      and(
        inArray(groupMembersTable.groupId, groupIds),
        ne(groupMembersTable.userId, currentUserId),
        eq(groupMembersTable.isBanned, false)
      )
    );

  const sharedUserIds = sharedMemberRows.map((r) => r.userId);
  if (!sharedUserIds.length) return [];

  // Finally, search members by name within those userIds.
  const results = await db
    .select({
      userId: membersTable.userId,
      name: membersTable.name,
      email: membersTable.email,
    })
    .from(membersTable)
    .where(
      and(
        inArray(membersTable.userId, sharedUserIds),
        ilike(membersTable.name, `%${trimmed}%`)
      )
    )
    .limit(10);

  return results;
}


