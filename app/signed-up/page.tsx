import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ensureMemberForUser } from "@/db/queries/members";
import { getClerkUserDetails } from "@/lib/clerk-user";
import { getMemberAccessStatus } from "@/lib/member-access";
import { SignedUpAuthCallback } from "./SignedUpAuthCallback";

export const dynamic = "force-dynamic";

function getDisplayName(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>
): string | null {
  if (user.fullName) return user.fullName;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

export default async function SignedUpPage() {
  const { userId } = await auth();

  if (!userId) {
    return <SignedUpAuthCallback />;
  }

  const [user, clerkDetails] = await Promise.all([
    currentUser(),
    getClerkUserDetails(userId),
  ]);

  const email = user?.primaryEmailAddress?.emailAddress ?? clerkDetails.email;
  const profilePicture = user?.imageUrl ?? clerkDetails.profilePicture;
  const signedUpAt = clerkDetails.signedUpAt;
  const name = user ? getDisplayName(user) : null;

  await ensureMemberForUser({
    userId,
    email,
    name,
    profilePicture,
    signedUpAt,
  });

  const access = await getMemberAccessStatus(userId);

  if (access.isPaidSubscriber) {
    redirect("/dashboard");
  }

  redirect("/billing");
}
