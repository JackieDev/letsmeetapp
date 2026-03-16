"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { sendReportIssueEmail } from "@/lib/email";

const reportIssueSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(1, "Message is required").max(5000),
});

export type ReportIssueInput = z.infer<typeof reportIssueSchema>;

export type ReportIssueResult =
  | { success: true }
  | { success: false; error: string };

export async function submitReportIssue(input: ReportIssueInput): Promise<ReportIssueResult> {
  const parsed = reportIssueSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const message = [first.email?.[0], first.message?.[0]].filter(Boolean).join(" ") || "Invalid input.";
    return { success: false, error: message };
  }

  const { userId } = await auth();
  const user = await currentUser();
  const userName =
    [user?.firstName?.trim(), user?.lastName?.trim()].filter(Boolean).join(" ") ||
    user?.emailAddresses?.[0]?.emailAddress ||
    null;

  await sendReportIssueEmail({
    email: parsed.data.email,
    message: parsed.data.message,
    userName: userName ?? null,
    userId: userId ?? null,
  });

  return { success: true };
}
