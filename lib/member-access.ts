import { currentUser } from "@clerk/nextjs/server";
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

async function resolveSignedUpAt(
  member: Member,
  clerkSignedUpAt: Date | null
): Promise<Date | null> {
  if (member.signedUpAt) return new Date(member.signedUpAt);
  return clerkSignedUpAt;
}

export async function getMemberAccessStatus(userId: string): Promise<MemberAccessStatus> {
  const clerkUser = await currentUser();
  const clerkSignedUpAt = clerkUser?.createdAt ? new Date(clerkUser.createdAt) : null;

  let member = await getMemberByUserId(userId);
  if (!member) {
    member = await ensureMemberForUser({
      userId,
      email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
      profilePicture: clerkUser?.imageUrl ?? null,
      signedUpAt: clerkSignedUpAt,
    });
  } else if (!member.signedUpAt && clerkSignedUpAt) {
    member = await ensureMemberForUser({
      userId,
      signedUpAt: clerkSignedUpAt,
    });
  }

  const signedUpAt = await resolveSignedUpAt(member, clerkSignedUpAt);
  const trialEndsAt = signedUpAt ? getTrialEndsAt(signedUpAt) : null;
  const isInFreeTrial = signedUpAt ? isWithinFreeTrial(signedUpAt) : false;

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
