"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { sendContactEmail } from "@/lib/email";

const contactSchema = z.object({
  name: z
    .string()
    .max(200, "Name is too long")
    .optional()
    .transform((value) => value?.trim() || undefined),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(1, "Message is required").max(5000),
});

export type ContactInput = z.infer<typeof contactSchema>;

export type ContactResult =
  | { success: true }
  | { success: false; error: string };

export async function submitContact(input: {
  name?: string;
  email: string;
  message: string;
}): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message =
      [first.name?.[0], first.email?.[0], first.message?.[0]]
        .filter(Boolean)
        .join(" ") || "Invalid input.";
    return { success: false, error: message };
  }

  const { userId } = await auth();

  const emailResult = await sendContactEmail({
    name: parsed.data.name ?? null,
    email: parsed.data.email,
    message: parsed.data.message,
    userId: userId ?? null,
  });

  if (!emailResult.ok) {
    return {
      success: false,
      error:
        "We could not send your message right now. Please try again later or email jacqueline@letsmeet.uk directly.",
    };
  }

  return { success: true };
}
