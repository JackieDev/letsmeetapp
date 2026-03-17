"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { insertMessage, searchSharedGroupMembersByName } from "@/db/queries/messages";
import { getMemberByUserId } from "@/db/queries/members";

const sendMessageSchema = z.object({
  recipientName: z.string().min(1, "Please enter a name.").max(255),
  body: z.string().min(1, "Message cannot be empty.").max(2000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export async function sendMessageToUser(input: SendMessageInput) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const parsed = sendMessageSchema.parse(input);

  const candidates = await searchSharedGroupMembersByName(
    userId,
    parsed.recipientName
  );

  if (candidates.length === 0) {
    throw new Error("No users with that name in your groups.");
  }

  if (candidates.length > 1) {
    throw new Error(
      "More than one user shares that name in your groups. Please type a more specific name."
    );
  }

  const recipient = candidates[0];

  await insertMessage({
    senderUserId: userId,
    recipientUserId: recipient.userId,
    body: parsed.body,
  });

  // Ensure sender has a member row as well (in case they haven't visited dashboard yet).
  await getMemberByUserId(userId);

  revalidatePath("/dashboard");
}

