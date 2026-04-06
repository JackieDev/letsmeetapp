"use server";

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  sendGroupMemberJoinRequestEmail,
  sendNewGroupApprovalEmail,
  sendGroupApprovedOwnerEmail,
} from "@/lib/email";
import {
  addGroupMember,
  approveGroupById,
  deleteGroupById,
  getGroup,
  getGroupByNameAndCity,
  getGroupMemberByUserId,
  insertGroup,
  isUserGroupMember,
  approveGroupMemberByUserId,
  setGroupMemberApprovalRequirement as setGroupMemberApprovalRequirementDb,
  removeGroupMemberByUserId,
  setGroupMemberBannedStatus,
  updateGroup,
  updateGroupMemberName,
  updateGroupMemberRole,
  isUserBannedFromGroup,
  markGroupApprovalNotified,
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

const approveGroupSchema = z.object({
  groupId: z.number().int().positive(),
});

export type ApproveGroupInput = z.infer<typeof approveGroupSchema>;

export type ApproveGroupResult =
  | { success: true }
  | { success: false; error: string };

export async function approveGroup(input: ApproveGroupInput): Promise<ApproveGroupResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const user = await currentUser();
  const approverEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  const isEmailApprover = approverEmail === "jacqueline@letsmeet.uk";

  if (!isEmailApprover) {
    return { success: false, error: "You are not authorized to approve groups." };
  }

  const parsed = approveGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }

  if (!group.isApproved) {
    await approveGroupById(group.id);
  }

  if (!group.notifiedApproval) {
    try {
      const client = await clerkClient();
      const owner = await client.users.getUser(group.ownerId);
      const toEmail = owner.primaryEmailAddress?.emailAddress;

      if (toEmail) {
        await sendGroupApprovedOwnerEmail({
          toEmail,
          groupName: group.name,
          groupCity: group.city,
        });
      }
    } catch (err) {
      // Email failures should not block group approval.
      console.error("[approveGroup] Failed to notify group owner:", err);
    }

    await markGroupApprovalNotified(group.id);
  }

  revalidatePath("/groups/search");
  revalidatePath(`/group/${group.id}`);
  revalidatePath("/dashboard");

  return { success: true };
}

const deletePendingGroupSchema = z.object({
  groupId: z.number().int().positive(),
});

export type DeletePendingGroupInput = z.infer<typeof deletePendingGroupSchema>;

export type DeletePendingGroupResult =
  | { success: true }
  | { success: false; error: string };

export async function deletePendingGroup(
  input: DeletePendingGroupInput
): Promise<DeletePendingGroupResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const user = await currentUser();
  const approverEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  const isEmailApprover = approverEmail === "jacqueline@letsmeet.uk";
  if (!isEmailApprover) {
    return { success: false, error: "You are not authorized to manage groups." };
  }

  const parsed = deletePendingGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }

  if (group.isApproved) {
    return { success: false, error: "Only pending groups can be deleted here." };
  }

  await deleteGroupById(group.id);

  revalidatePath("/groups/search");
  revalidatePath(`/group/${group.id}`);
  revalidatePath("/dashboard");

  return { success: true };
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

  const isBanned = await isUserBannedFromGroup(parsed.data.groupId, userId);
  if (isBanned) {
    return {
      success: false,
      error: "You have been banned from this group and cannot join.",
    };
  }

  const isMember = await isUserGroupMember(parsed.data.groupId, userId);
  if (isMember) {
    return { success: false, error: "You are already a member of this group." };
  }

  const existingMembership = await getGroupMemberByUserId(
    parsed.data.groupId,
    userId
  );

  if (existingMembership && !existingMembership.isBanned) {
    if (existingMembership.isMemberApproved) {
      return { success: false, error: "You are already a member of this group." };
    }

    if (group.requiresMemberApproval) {
      return {
        success: false,
        error: "Your request is pending approval by the group owner.",
      };
    }

    // Owner disabled approvals: promote this membership.
    await approveGroupMemberByUserId(parsed.data.groupId, userId);
    revalidatePath(`/group/${parsed.data.groupId}`);
    revalidatePath("/dashboard");
    return { success: true };
  }

  const user = await currentUser();
  const first = user?.firstName?.trim() ?? "";
  const lastInitial = user?.lastName?.trim()?.[0] ?? "";
  const memberName =
    [first, lastInitial].filter(Boolean).join(" ") ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Group member";

  const shouldRequireApproval = group.requiresMemberApproval;
  await addGroupMember({
    groupId: parsed.data.groupId,
    userId,
    name: memberName.slice(0, 255),
    role: "member",
    isMemberApproved: !shouldRequireApproval,
  });

  if (shouldRequireApproval) {
    // Notify the group owner that a join request is pending.
    try {
      const ownerClient = await clerkClient();
      const owner = await ownerClient.users.getUser(group.ownerId);
      const toEmail = owner.primaryEmailAddress?.emailAddress;

      if (toEmail) {
        await sendGroupMemberJoinRequestEmail({
          toEmail,
          requesterName: memberName.slice(0, 255),
          requesterId: userId,
          groupId: group.id,
          groupName: group.name,
          groupCity: group.city,
        });
      }
    } catch (err) {
      // Email failures should not block join requests.
      console.error("[joinGroup] Failed to notify owner:", err);
    }
  }

  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

const approveGroupMemberSchema = z.object({
  groupId: z.number().int().positive(),
  userId: z.string().min(1),
});

export type ApproveGroupMemberInput = z.infer<typeof approveGroupMemberSchema>;

export type ApproveGroupMemberResult =
  | { success: true }
  | { success: false; error: string };

export async function approveGroupMember(
  input: ApproveGroupMemberInput
): Promise<ApproveGroupMemberResult> {
  const { userId: currentOwnerId } = await auth();
  if (!currentOwnerId) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = approveGroupMemberSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }

  if (group.ownerId !== currentOwnerId) {
    return {
      success: false,
      error: "Only the group owner can approve members.",
    };
  }

  if (parsed.data.userId === group.ownerId) {
    return { success: false, error: "The owner is already approved." };
  }

  await approveGroupMemberByUserId(parsed.data.groupId, parsed.data.userId);
  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

const setGroupMemberApprovalRequirementSchema = z.object({
  groupId: z.number().int().positive(),
  requiresMemberApproval: z.boolean(),
});

export type SetGroupMemberApprovalRequirementInput = z.infer<
  typeof setGroupMemberApprovalRequirementSchema
>;

export type SetGroupMemberApprovalRequirementResult =
  | { success: true }
  | { success: false; error: string };

export async function setGroupMemberApprovalRequirement(
  input: SetGroupMemberApprovalRequirementInput
): Promise<SetGroupMemberApprovalRequirementResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = setGroupMemberApprovalRequirementSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }

  if (group.ownerId !== userId) {
    return { success: false, error: "Only the group owner can update this setting." };
  }

  await setGroupMemberApprovalRequirementDb(
    parsed.data.groupId,
    parsed.data.requiresMemberApproval
  );

  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

const leaveGroupSchema = z.object({
  groupId: z.number().int().positive(),
});

export type LeaveGroupInput = z.infer<typeof leaveGroupSchema>;

export type LeaveGroupResult =
  | { success: true }
  | { success: false; error: string };

export async function leaveGroup(input: LeaveGroupInput): Promise<LeaveGroupResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to leave a group." };
  }

  const parsed = leaveGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }

  if (group.ownerId === userId) {
    return {
      success: false,
      error: "You cannot leave a group you own. Delete the group or transfer ownership first.",
    };
  }

  const isMember = await isUserGroupMember(parsed.data.groupId, userId);
  if (!isMember) {
    return { success: false, error: "You are not a member of this group." };
  }

  await removeGroupMemberByUserId(parsed.data.groupId, userId);
  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath("/dashboard");

  return { success: true };
}

const updateOwnedGroupDetailsSchema = z.object({
  groupId: z.number().int().positive(),
  name: z.string().trim().min(1, "Group name is required.").max(255),
  profilePicture: z
    .string()
    .max(3_000_000)
    .refine(
      (value) =>
        value.length === 0 ||
        z.string().url().safeParse(value).success ||
        /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/.test(value),
      { message: "Profile picture must be a valid URL or uploaded image." }
    )
    .optional(),
});

export type UpdateOwnedGroupDetailsInput = z.infer<
  typeof updateOwnedGroupDetailsSchema
>;

export type UpdateOwnedGroupDetailsResult =
  | { success: true }
  | { success: false; error: string };

export async function updateOwnedGroupDetails(
  input: UpdateOwnedGroupDetailsInput
): Promise<UpdateOwnedGroupDetailsResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = updateOwnedGroupDetailsSchema.safeParse(input);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    const message =
      fields.name?.[0] ?? fields.profilePicture?.[0] ?? "Invalid input.";
    return { success: false, error: message };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }
  if (group.ownerId !== userId) {
    return {
      success: false,
      error: "Only the group owner can update group details.",
    };
  }

  const existing = await getGroupByNameAndCity(
    parsed.data.name,
    group.city,
    group.id
  );
  if (existing) {
    return {
      success: false,
      error: "Another group in this city already uses that name.",
    };
  }

  await updateGroup(parsed.data.groupId, {
    name: parsed.data.name,
    profilePicture: parsed.data.profilePicture
      ? parsed.data.profilePicture
      : null,
  });

  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath("/groups/search");
  revalidatePath("/dashboard");

  return { success: true };
}

const closeOwnedGroupSchema = z.object({
  groupId: z.number().int().positive(),
});

export type CloseOwnedGroupInput = z.infer<typeof closeOwnedGroupSchema>;

export type CloseOwnedGroupResult =
  | { success: true }
  | { success: false; error: string };

export async function closeOwnedGroup(
  input: CloseOwnedGroupInput
): Promise<CloseOwnedGroupResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = closeOwnedGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input." };
  }

  const group = await getGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }
  if (group.ownerId !== userId) {
    return {
      success: false,
      error: "Only the group owner can close the group.",
    };
  }

  await deleteGroupById(parsed.data.groupId);

  revalidatePath(`/group/${parsed.data.groupId}`);
  revalidatePath("/groups/search");
  revalidatePath("/dashboard");

  return { success: true };
}
