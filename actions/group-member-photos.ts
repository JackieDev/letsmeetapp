"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addGroupMemberPhotos,
  getApprovedGroup,
  isUserGroupMember,
} from "@/db/queries/groups";

const dataUrlImagePattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+$/;

const uploadGroupMemberPhotosSchema = z.object({
  groupId: z.number().int().positive(),
  photos: z
    .array(
      z
        .string()
        .max(3_000_000)
        .refine((value) => dataUrlImagePattern.test(value), {
          message: "Each photo must be a valid uploaded image.",
        })
    )
    .min(1)
    .max(10),
});

type UploadGroupMemberPhotosInput = z.infer<typeof uploadGroupMemberPhotosSchema>;

export type UploadGroupMemberPhotosResult =
  | { success: true }
  | { success: false; error: string };

export async function uploadGroupMemberPhotos(
  input: UploadGroupMemberPhotosInput
): Promise<UploadGroupMemberPhotosResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in." };
  }

  const parsed = uploadGroupMemberPhotosSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid photo upload input." };
  }

  const group = await getApprovedGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }

  const isMember = await isUserGroupMember(parsed.data.groupId, userId);
  if (!isMember) {
    return { success: false, error: "Only group members can upload photos." };
  }

  await addGroupMemberPhotos(parsed.data.groupId, userId, parsed.data.photos);
  revalidatePath(`/group/${parsed.data.groupId}`);

  return { success: true };
}
