"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateMemberProfile } from "@/db/queries/members";

const updateMemberProfileSchema = z.object({
  name: z.string().max(255).or(z.literal("")).optional(),
  profilePicture: z.string().url().max(500).or(z.literal("")).optional(),
  city: z.string().max(100).or(z.literal("")).optional(),
  interests: z.string().max(2000).or(z.literal("")).optional(),
});

export type UpdateMemberProfileInput = z.infer<typeof updateMemberProfileSchema>;

export async function updateCurrentMemberProfile(input: UpdateMemberProfileInput) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const validated = updateMemberProfileSchema.parse(input);

  const normalized = {
    name: validated.name ? validated.name : null,
    profilePicture: validated.profilePicture
      ? validated.profilePicture
      : null,
    city: validated.city ? validated.city : null,
    interests: validated.interests ? validated.interests : null,
  };

  await updateMemberProfile(userId, normalized);
  revalidatePath("/dashboard");
}

