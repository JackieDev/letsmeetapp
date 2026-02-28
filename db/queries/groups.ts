import { and, eq, ilike, or, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { groupMembersTable, groupsTable } from "@/db/schema";

/** Escape % and _ for safe use in ilike (treat as literal). */
function escapeIlike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export type GroupInsert = typeof groupsTable.$inferInsert;
export type Group = typeof groupsTable.$inferSelect;

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

/** Get the number of members in a group. */
export async function getGroupMemberCount(groupId: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(groupMembersTable)
    .where(eq(groupMembersTable.groupId, groupId));
  return row?.count ?? 0;
}

/** True if the user is the group owner or has a row in group_members. */
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
        eq(groupMembersTable.userId, userId)
      )
    );
  return !!member;
}

/** Get all groups. */
export async function getGroups() {
  return db.select().from(groupsTable);
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
    .where(eq(groupMembersTable.userId, userId));
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
  role: "owner" | "organizer" | "member";
}) {
  await db.insert(groupMembersTable).values(data);
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

/** Delete a group by id. */
export async function deleteGroupById(id: number) {
  await db.delete(groupsTable).where(eq(groupsTable.id, id));
}
