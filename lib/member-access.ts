import { clerkClient } from "@clerk/nextjs/server";
import { ensureMemberForUser, getMemberByUserId, type Member } from "@/db/queries/members";
import { getUserHasActivePaidSubscription } from "@/lib/clerk-billing";
import {
  getTrialEndsAt,
  isWithinFreeTrial,
} from "@/lib/free-trial";

export type MemberAccessStatus = {
  member: Member;
  hasAccess: boolean;
  isPaidSubscriber: boolean;
  isInFreeTrial: boolean;
  signedUpAt: Date | null;
  trialEndsAt: Date | null;
};

async function getClerkSignUpDate(userId: string): Promise<Date | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.createdAt ? new Date(user.createdAt) : null;
  } catch {
    return null;
  }
}

async function resolveSignedUpAt(member: Member, userId: string): Promise<Date> {
  if (member.signedUpAt) return new Date(member.signedUpAt);

  const clerkSignedUpAt = await getClerkSignUpDate(userId);
  if (clerkSignedUpAt) {
    const updated = await ensureMemberForUser({ userId, signedUpAt: clerkSignedUpAt });
    return updated.signedUpAt ? new Date(updated.signedUpAt) : clerkSignedUpAt;
  }

  // Last resort: start trial from first successful access check.
  const trialStart = new Date();
  const updated = await ensureMemberForUser({ userId, signedUpAt: trialStart });
  return updated.signedUpAt ? new Date(updated.signedUpAt) : trialStart;
}

export async function getMemberAccessStatus(userId: string): Promise<MemberAccessStatus> {
  let member = await getMemberByUserId(userId);
  if (!member) {
    const clerkSignedUpAt = await getClerkSignUpDate(userId);
    member = await ensureMemberForUser({
      userId,
      signedUpAt: clerkSignedUpAt,
    });
  }

  const signedUpAt = await resolveSignedUpAt(member, userId);
  const trialEndsAt = getTrialEndsAt(signedUpAt);
  const isInFreeTrial = isWithinFreeTrial(signedUpAt);

  let isPaidSubscriber = member.isPaidSubscriber;
  if (!isPaidSubscriber) {
    const billing = await getUserHasActivePaidSubscription(userId).catch(() => ({
      isPaidSubscriber: false,
    }));
    isPaidSubscriber = billing.isPaidSubscriber;
  }

  const hasAccess = isPaidSubscriber || isInFreeTrial;

  return {
    member,
    hasAccess,
    isPaidSubscriber,
    isInFreeTrial,
    signedUpAt,
    trialEndsAt,
  };
}
