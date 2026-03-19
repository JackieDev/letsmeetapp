import { and, eq, ilike, ne, or, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { groupMembersTable, groupsTable, membersTable } from "@/db/schema";

/** Escape % and _ for safe use in ilike (treat as literal). */
function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type GroupInsert = typeof groupsTable.$inferInsert;
export type Group = typeof groupsTable.$inferSelect;
export type GroupMember = typeof groupMembersTable.$inferSelect;

/** Get a single group by id. Returns null if not found. */
export async function getGroup(id: number) {
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.id, id));
  return group ?? null;
}

/** Get a single approved group by id. Returns null if not found or not approved. */
export async function getApprovedGroup(id: number) {
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(and(eq(groupsTable.id, id), eq(groupsTable.isApproved, true)));
  return group ?? null;
}

/**
 * Get a group by exact name and city. Returns null if none found.
 * Optionally exclude a group id (e.g. when updating that group).
 */
export async function getGroupByNameAndCity(
  name: string,
  city: string,
  excludeId?: number
): Promise<Group | null> {
  const conditions = [
    eq(groupsTable.name, name),
    eq(groupsTable.city, city),
  ];
  if (excludeId !== undefined) {
    conditions.push(ne(groupsTable.id, excludeId));
  }
  const [group] = await db
    .select()
    .from(groupsTable)
    .where(and(...conditions));
  return group ?? null;
}

/** Get the number of non-banned members in a group. */
export async function getGroupMemberCount(groupId: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.isBanned, false),
        eq(groupMembersTable.isMemberApproved, true)
      )
    );
  return row?.count ?? 0;
}

/**
 * True if the user is the group owner or has a non-banned row in group_members.
 * Banned members are treated as non-members.
 */
export async function isUserGroupMember(groupId: number, userId: string) {
  const [group] = await db
    .select({ ownerId: groupsTable.ownerId })
    .from(groupsTable)
    .where(eq(groupsTable.id, groupId));
  if (group?.ownerId === userId) return true;
  const [member] = await db
    .select({ id: groupMembersTable.id })
    .from(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId),
        eq(groupMembersTable.isBanned, false),
        eq(groupMembersTable.isMemberApproved, true)
      )
    );
  return !!member;
}

/** Get all groups. */
export async function getGroups() {
  return db.select().from(groupsTable);
}

/** Get pending groups that still need admin approval. */
export async function getPendingGroupsForApproval() {
  return db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.isApproved, false))
    .orderBy(groupsTable.createdAt);
}

/** Get all groups owned by a user. */
export async function getGroupsByOwnerId(ownerId: string) {
  return db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.ownerId, ownerId));
}

/** Get all (approved) groups the user is a member of: owner or in group_members. */
export async function getGroupsUserIsMemberOf(userId: string) {
  const memberRows = await db
    .select({ groupId: groupMembersTable.groupId })
    .from(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.userId, userId),
        eq(groupMembersTable.isBanned, false),
        eq(groupMembersTable.isMemberApproved, true)
      )
    );
  const memberGroupIds = memberRows.map((r) => r.groupId);
  return db
    .select()
    .from(groupsTable)
    .where(
      and(
        eq(groupsTable.isApproved, true),
        or(
          eq(groupsTable.ownerId, userId),
          inArray(groupsTable.id, memberGroupIds.length ? memberGroupIds : [-1])
        )
      )
    )
    .orderBy(groupsTable.name);
}

/** Search approved groups by name and/or city (partial, case-insensitive). */
export async function searchGroups(filters: { name?: string; city?: string }) {
  const { name, city } = filters;
  const conditions = [eq(groupsTable.isApproved, true)];
  if (name?.trim()) {
    conditions.push(ilike(groupsTable.name, `%${escapeIlike(name.trim())}%`));
  }
  if (city?.trim()) {
    conditions.push(ilike(groupsTable.city, `%${escapeIlike(city.trim())}%`));
  }
  return db
    .select()
    .from(groupsTable)
    .where(and(...conditions));
}

/** Create a new group. Returns the created group (with id). */
export async function insertGroup(data: GroupInsert) {
  const [group] = await db.insert(groupsTable).values(data).returning();
  return group!;
}

/** Add a member to a group (e.g. owner after creating the group). */
export async function addGroupMember(data: {
  groupId: number;
  userId: string;
  name: string;
  role: "owner" | "organizer" | "member";
  isMemberApproved?: boolean;
}) {
  const desiredIsMemberApproved = data.isMemberApproved ?? true;
  const [existing] = await db
    .select({
      id: groupMembersTable.id,
      isBanned: groupMembersTable.isBanned,
      isMemberApproved: groupMembersTable.isMemberApproved,
    })
    .from(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.groupId, data.groupId),
        eq(groupMembersTable.userId, data.userId)
      )
    );

  // If the user is banned, do not allow re-adding them as a member.
  if (existing?.isBanned) {
    throw new Error("User is banned from this group.");
  }

  // If they already have a non-banned membership row, treat as idempotent.
  if (existing && !existing.isBanned) {
    // Only allow moving from pending -> approved. Never downgrade an approved member back to pending.
    if (desiredIsMemberApproved && !existing.isMemberApproved) {
      await db
        .update(groupMembersTable)
        .set({ isMemberApproved: true })
        .where(
          and(
            eq(groupMembersTable.groupId, data.groupId),
            eq(groupMembersTable.userId, data.userId)
          )
        );
    }
    return;
  }

  await db.insert(groupMembersTable).values(data);
}

/** Approve a pending membership request. Owner-only. */
export async function approveGroupMemberByUserId(
  groupId: number,
  userId: string
) {
  await db
    .update(groupMembersTable)
    .set({ isMemberApproved: true, isBanned: false })
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId)
      )
    );
}

/** Update per-group member-approval requirement, and optionally auto-approve pending requests. */
export async function setGroupMemberApprovalRequirement(
  groupId: number,
  requiresMemberApproval: boolean
) {
  await db
    .update(groupsTable)
    .set({ requiresMemberApproval })
    .where(eq(groupsTable.id, groupId));

  // If the owner disables approvals, promote any pending (non-banned) requests.
  if (!requiresMemberApproval) {
    await db
      .update(groupMembersTable)
      .set({ isMemberApproved: true })
      .where(
        and(
          eq(groupMembersTable.groupId, groupId),
          eq(groupMembersTable.isBanned, false)
        )
      );
  }
}

/** Whether the user has a banned membership row for this group. */
export async function isUserBannedFromGroup(groupId: number, userId: string) {
  const [row] = await db
    .select({ isBanned: groupMembersTable.isBanned })
    .from(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId)
      )
    );
  return row?.isBanned === true;
}

/** Get all members (including banned) for a group. */
export async function getGroupMembers(groupId: number): Promise<GroupMember[]> {
  return db
    .select()
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, groupId))
    .orderBy(groupMembersTable.joinedAt);
}

export type GroupMemberProfile = {
  userId: string;
  name: string;
  profilePicture: string | null;
  role: "owner" | "organizer" | "member";
};

/**
 * Get approved, non-banned group members with profile pictures for display.
 * Pending members are intentionally excluded.
 */
export async function getApprovedGroupMembersWithProfiles(
  groupId: number
): Promise<GroupMemberProfile[]> {
  return db
    .select({
      userId: groupMembersTable.userId,
      name: groupMembersTable.name,
      profilePicture: membersTable.profilePicture,
      role: groupMembersTable.role,
    })
    .from(groupMembersTable)
    .leftJoin(membersTable, eq(membersTable.userId, groupMembersTable.userId))
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.isBanned, false),
        eq(groupMembersTable.isMemberApproved, true)
      )
    )
    .orderBy(groupMembersTable.joinedAt);
}

/** Remove a member from a group by user id. */
export async function removeGroupMemberByUserId(
  groupId: number,
  userId: string
) {
  await db
    .delete(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId)
      )
    );
}

/** Set the banned status for a group member by user id. */
export async function setGroupMemberBannedStatus(
  groupId: number,
  userId: string,
  isBanned: boolean
) {
  await db
    .update(groupMembersTable)
    .set({ isBanned })
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId)
      )
    );
}

/** Update the role for a group member by user id. */
export async function updateGroupMemberRole(
  groupId: number,
  userId: string,
  role: "organizer" | "member"
) {
  await db
    .update(groupMembersTable)
    .set({ role })
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId)
      )
    );
}

/** Get a single group member by group and user id. */
export async function getGroupMemberByUserId(
  groupId: number,
  userId: string
): Promise<GroupMember | null> {
  const [row] = await db
    .select()
    .from(groupMembersTable)
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId)
      )
    );
  return row ?? null;
}

/** Update the display name for a group member by user id. */
export async function updateGroupMemberName(
  groupId: number,
  userId: string,
  name: string
) {
  await db
    .update(groupMembersTable)
    .set({ name: name.slice(0, 255) })
    .where(
      and(
        eq(groupMembersTable.groupId, groupId),
        eq(groupMembersTable.userId, userId)
      )
    );
}

/** Update a group by id. */
export async function updateGroup(
  id: number,
  data: Partial<Omit<GroupInsert, "id" | "createdAt">>
) {
  await db
    .update(groupsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(groupsTable.id, id));
}

/** Approve a group by id. */
export async function approveGroupById(id: number) {
  await db
    .update(groupsTable)
    .set({ isApproved: true, updatedAt: new Date() })
    .where(eq(groupsTable.id, id));
}

/** Mark that the owner has been notified about approval. */
export async function markGroupApprovalNotified(id: number) {
  await db
    .update(groupsTable)
    .set({ notifiedApproval: true, updatedAt: new Date() })
    .where(eq(groupsTable.id, id));
}

/** Delete a group by id. */
export async function deleteGroupById(id: number) {
  await db.delete(groupsTable).where(eq(groupsTable.id, id));
}
