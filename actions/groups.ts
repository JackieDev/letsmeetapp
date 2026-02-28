"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendNewGroupApprovalEmail } from "@/lib/email";
import { addGroupMember, insertGroup } from "@/db/queries/groups";

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
  const group = await insertGroup({
    name,
    description: description ?? null,
    city,
    ownerId: userId,
  });
  await addGroupMember({ groupId: group.id, userId, role: "owner" });

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
