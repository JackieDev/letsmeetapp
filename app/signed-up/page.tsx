import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getMemberAccessStatus } from "@/lib/member-access";
import { SignedUpAuthCallback } from "./SignedUpAuthCallback";

export const dynamic = "force-dynamic";

export default async function SignedUpPage() {
  const { userId } = await auth();

  if (!userId) {
    return <SignedUpAuthCallback />;
  }

  const access = await getMemberAccessStatus(userId);

  if (access.isPaidSubscriber) {
    redirect("/dashboard");
  }

  redirect("/billing");
}
