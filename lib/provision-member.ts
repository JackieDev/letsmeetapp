import { currentUser } from "@clerk/nextjs/server";
import { ensureMemberForUser, type Member } from "@/db/queries/members";
import { getClerkUserDetails } from "@/lib/clerk-user";

function getDisplayName(
  user: NonNullable<Awaited<ReturnType<typeof currentUser>>>
): string | null {
  if (user.fullName) return user.fullName;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

/** Create or update the members row from Clerk profile data. */
export async function provisionMemberFromClerk(userId: string): Promise<Member> {
  const [sessionUser, clerkDetails] = await Promise.all([
    currentUser(),
    getClerkUserDetails(userId),
  ]);

  const useSessionUser = sessionUser?.id === userId ? sessionUser : null;
  const email =
    useSessionUser?.primaryEmailAddress?.emailAddress ?? clerkDetails.email;
  const profilePicture = useSessionUser?.imageUrl ?? clerkDetails.profilePicture;
  const signedUpAt = clerkDetails.signedUpAt;
  const name = useSessionUser ? getDisplayName(useSessionUser) : clerkDetails.name;

  return ensureMemberForUser({
    userId,
    email,
    name,
    profilePicture,
    signedUpAt,
  });
}
