"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/db/queries/notifications";

const markNotificationReadSchema = z.object({
  notificationId: z.number().int().positive(),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

export async function markNotificationReadAction(
  input: MarkNotificationReadInput
): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const parsed = markNotificationReadSchema.safeParse(input);
  if (!parsed.success) return;

  await markNotificationRead(parsed.data.notificationId, userId);
  revalidatePath("/dashboard");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  await markAllNotificationsRead(userId);
  revalidatePath("/dashboard");
}
