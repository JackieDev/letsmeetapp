import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { groupMembersTable, membersTable } from "@/db/schema";

export type Member = typeof membersTable.$inferSelect;

/** Ensure there is a members row for this Clerk user id. */
export async function ensureMemberForUser(params: {
  userId: string;
  email?: string | null;
  profilePicture?: string | null;
}) {
  const { userId, email, profilePicture } = params;

  const existing = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.userId, userId));

  if (existing.length > 0) return existing[0];

  const [inserted] = await db
    .insert(membersTable)
    .values({
      userId,
      email: email ?? `${userId}@placeholder.local`,
      profilePicture: profilePicture ?? null,
    })
    .returning();

  return inserted!;
}

export async function getMemberByUserId(userId: string) {
  const [row] = await db
    .select()
    .from(membersTable)
    .where(eq(membersTable.userId, userId));
  return row ?? null;
}

export async function updateMemberProfile(
  userId: string,
  data: {
    name?: string | null;
    profilePicture?: string | null;
    city?: string | null;
    interests?: string | null;
  }
) {
  await db
    .update(membersTable)
    .set(data)
    .where(eq(membersTable.userId, userId));
}

/** Backfill the members table with one row per distinct group member userId. */
export async function backfillMembersFromGroupMembers() {
  // Get distinct userIds from group_members
  const distinctGroupMembers = await db
    .selectDistinct({ userId: groupMembersTable.userId })
    .from(groupMembersTable);

  if (!distinctGroupMembers.length) return 0;

  const userIds = distinctGroupMembers.map((m) => m.userId);

  // Find which of these already exist in members
  const existingMembers = await db
    .select({ userId: membersTable.userId })
    .from(membersTable)
    .where(inArray(membersTable.userId, userIds));

  const existingUserIds = new Set(existingMembers.map((m) => m.userId));

  // Insert only missing userIds
  const toInsert = distinctGroupMembers
    .filter((m) => !existingUserIds.has(m.userId))
    .map((m) => ({
      userId: m.userId,
      // Temporary placeholder email to satisfy NOT NULL constraint.
      // You can later backfill real emails from Clerk if desired.
      email: `${m.userId}@placeholder.local`,
    }));

  if (!toInsert.length) return 0;

  await db.insert(membersTable).values(toInsert);
  return toInsert.length;
}

