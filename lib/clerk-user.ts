import { clerkClient } from "@clerk/nextjs/server";

export type ClerkUserDetails = {
  signedUpAt: Date | null;
  email: string | null;
  profilePicture: string | null;
  name: string | null;
};

function getNameFromClerkUser(user: {
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string | null {
  if (user.fullName) return user.fullName;
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

export async function getClerkUserDetails(userId: string): Promise<ClerkUserDetails> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return {
      signedUpAt: user.createdAt ? new Date(user.createdAt) : null,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      profilePicture: user.imageUrl ?? null,
      name: getNameFromClerkUser(user),
    };
  } catch {
    return { signedUpAt: null, email: null, profilePicture: null, name: null };
  }
}
