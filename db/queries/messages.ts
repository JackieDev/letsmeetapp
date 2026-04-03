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

export async function getMessagesForUser(
  userId: string,
  options?: { limit?: number }
): Promise<MessageWithUsers[]> {
  const limit = options?.limit ?? 150;

  const rows = await db
    .select({
      id: messagesTable.id,
      body: messagesTable.body,
      createdAt: messagesTable.createdAt,
      readAt: messagesTable.readAt,
      senderUserId: messagesTable.senderUserId,
      recipientUserId: messagesTable.recipientUserId,
    })
    .from(messagesTable)
    .where(
      or(
        eq(messagesTable.senderUserId, userId),
        eq(messagesTable.recipientUserId, userId)
      )
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);

  const participantIds = Array.from(
    new Set(rows.flatMap((row) => [row.senderUserId, row.recipientUserId]))
  );

  const participants = participantIds.length
    ? await db
        .select({
          userId: membersTable.userId,
          name: membersTable.name,
          email: membersTable.email,
        })
        .from(membersTable)
        .where(inArray(membersTable.userId, participantIds))
    : [];

  const participantById = new Map(
    participants.map((participant) => [participant.userId, participant])
  );

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    readAt: row.readAt,
    senderUserId: row.senderUserId,
    recipientUserId: row.recipientUserId,
    senderName: participantById.get(row.senderUserId)?.name ?? null,
    senderEmail: participantById.get(row.senderUserId)?.email ?? row.senderUserId,
    recipientName: participantById.get(row.recipientUserId)?.name ?? null,
    recipientEmail:
      participantById.get(row.recipientUserId)?.email ?? row.recipientUserId,
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
        eq(groupMembersTable.isBanned, false),
        eq(groupMembersTable.isMemberApproved, true)
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
        eq(groupMembersTable.isBanned, false),
        eq(groupMembersTable.isMemberApproved, true)
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


