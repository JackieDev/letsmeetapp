import { clerkClient } from "@clerk/nextjs/server";

export type ClerkUserDetails = {
  signedUpAt: Date | null;
  email: string | null;
  profilePicture: string | null;
};

export async function getClerkUserDetails(userId: string): Promise<ClerkUserDetails> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return {
      signedUpAt: user.createdAt ? new Date(user.createdAt) : null,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      profilePicture: user.imageUrl ?? null,
    };
  } catch {
    return { signedUpAt: null, email: null, profilePicture: null };
  }
}
