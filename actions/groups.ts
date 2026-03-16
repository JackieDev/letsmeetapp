"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendNewGroupApprovalEmail } from "@/lib/email";
import {
  addGroupMember,
  getGroup,
  getGroupByNameAndCity,
  insertGroup,
  isUserGroupMember,
  removeGroupMemberByUserId,
  setGroupMemberBannedStatus,
  updateGroupMemberName,
  updateGroupMemberRole,
  isUserBannedFromGroup,
} from "@/db/queries/groups";

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional(),
  city: z.string().min(1, "City is required").max(100),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export type CreateGroupResult =
  | { success: true; groupId: number }
  | { success: false; error: string };

export async function createGroup(input: CreateGroupInput): Promise<CreateGroupResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to create a group." };
  }

  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message = [first.name?.[0], first.city?.[0], first.description?.[0]]
      .filter(Boolean)
      .join(" ") || "Invalid input.";
    return { success: false, error: message };
  }

  const { name, description, city } = parsed.data;

  const existing = await getGroupByNameAndCity(name, city);
  if (existing) {
    return {
      success: false,
      error: "A group with this name already exists in this city.",
    };
  }

  const group = await insertGroup({
    name,
    description: description ?? null,
    city,
    ownerId: userId,
  });
  const user = await currentUser();
  const first = user?.firstName?.trim() ?? "";
  const lastInitial = user?.lastName?.trim()?.[0] ?? "";
  const memberName =
    [first, lastInitial].filter(Boolean).join(" ") ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Group owner";
  await addGroupMember({
    groupId: group.id,
    userId,
    name: memberName.slice(0, 255),
    role: "owner",
  });

  await sendNewGroupApprovalEmail({
    id: group.id,
    name: group.name,
    description: group.description,
    city: group.city,
    ownerId: group.ownerId,
  });

  revalidatePath("/groups");
  revalidatePath("/groups/search");
  revalidatePath("/dashboard");

  return { success: true, groupId: group.id };
}

const modifyMemberSchema = z.object({
  groupId: z.number().int().positive(),
  userId: z.string().min(1),
});

export type ModifyMemberInput = z.infer<typeof modifyMemberSchema>;

export type ModifyMemberResult =
  | { success: true }
  | { success: false; error: string };

export async function removeGroupMember(
  input: ModifyMemberInput
): Promise<ModifyMemberResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = modifyMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }
  if (group.ownerId !== userId) {
    return { success: false, error: "Only the group owner can manage members." };
  }
  if (parsed.data.userId === group.ownerId) {
    return { success: false, error: "You cannot remove yourself as the owner." };
  }

  await removeGroupMemberByUserId(parsed.data.groupId, parsed.data.userId);
  revalidatePath(`/group/${parsed.data.groupId}`);

  return { success: true };
}

const changeRoleSchema = z.object({
  groupId: z.number().int().positive(),
  userId: z.string().min(1),
  role: z.enum(["organizer", "member"]),
});

export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;

export type ChangeRoleResult =
  | { success: true }
  | { success: false; error: string };

export async function changeGroupMemberRole(
  input: ChangeRoleInput
): Promise<ChangeRoleResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = changeRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }
  if (group.ownerId !== userId) {
    return { success: false, error: "Only the group owner can manage members." };
  }
  if (parsed.data.userId === group.ownerId) {
    return { success: false, error: "You cannot change your own owner role." };
  }

  await updateGroupMemberRole(
    parsed.data.groupId,
    parsed.data.userId,
    parsed.data.role
  );
  revalidatePath(`/group/${parsed.data.groupId}`);

  return { success: true };
}

export async function toggleBanGroupMember(
  input: ModifyMemberInput
): Promise<ModifyMemberResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = modifyMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }
  if (group.ownerId !== userId) {
    return { success: false, error: "Only the group owner can manage members." };
  }
  if (parsed.data.userId === group.ownerId) {
    return { success: false, error: "You cannot ban yourself as the owner." };
  }

  // Toggle based on current state; simplest is to always set to true (ban).
  await setGroupMemberBannedStatus(parsed.data.groupId, parsed.data.userId, true);
  revalidatePath(`/group/${parsed.data.groupId}`);

  return { success: true };
}

const updateMyNameSchema = z.object({
  groupId: z.number().int().positive(),
  name: z.string().min(1, "Name is required").max(255),
});

export type UpdateMyGroupMemberNameInput = z.infer<typeof updateMyNameSchema>;

export type UpdateMyGroupMemberNameResult =
  | { success: true }
  | { success: false; error: string };

export async function updateMyGroupMemberName(
  input: UpdateMyGroupMemberNameInput
): Promise<UpdateMyGroupMemberNameResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = updateMyNameSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input.";
    return { success: false, error: msg };
  }

  const isMember = await isUserGroupMember(parsed.data.groupId, userId);
  if (!isMember) {
    return { success: false, error: "You are not a member of this group." };
  }

  await updateGroupMemberName(
    parsed.data.groupId,
    userId,
    parsed.data.name.trim()
  );
  revalidatePath(`/group/${parsed.data.groupId}`);

  return { success: true };
}

const joinGroupSchema = z.object({
  groupId: z.number().int().positive(),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;

export type JoinGroupResult =
  | { success: true }
  | { success: false; error: string };

export async function joinGroup(input: JoinGroupInput): Promise<JoinGroupResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to join a group." };
  }

  const parsed = joinGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group || !group.isApproved) {
    return { success: false, error: "Group not found." };
  }

  if (group.ownerId === userId) {
    return { success: false, error: "You are already the owner of this group." };
  }

  const isMember = await isUserGroupMember(parsed.data.groupId, userId);
  if (isMember) {
    return { success: false, error: "You are already a member of this group." };
  }

  const isBanned = await isUserBannedFromGroup(parsed.data.groupId, userId);
  if (isBanned) {
    return {
      success: false,
      error: "You have been banned from this group and cannot join.",
    };
  }

  const user = await currentUser();
  const first = user?.firstName?.trim() ?? "";
  const lastInitial = user?.lastName?.trim()?.[0] ?? "";
  const memberName =
    [first, lastInitial].filter(Boolean).join(" ") ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Group member";

  await addGroupMember({
    groupId: parsed.data.groupId,
    userId,
    name: memberName.slice(0, 255),
    role: "member",
  });

  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath("/dashboard");

  return { success: true };
}
