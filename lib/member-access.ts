import { ensureMemberForUser, getMemberByUserId, type Member } from "@/db/queries/members";
import { getClerkUserDetails } from "@/lib/clerk-user";
import {
  getTrialEndsAt,
  isWithinFreeTrial,
} from "@/lib/free-trial";

export type MemberAccessStatus = {
  member: Member | null;
  hasAccess: boolean;
  hasCompletedBillingSetup: boolean;
  isPaidSubscriber: boolean;
  isInFreeTrial: boolean;
  signedUpAt: Date | null;
  trialEndsAt: Date | null;
};

async function resolveSignedUpAt(member: Member, userId: string): Promise<Date> {
  if (member.signedUpAt) return new Date(member.signedUpAt);

  const { signedUpAt: clerkSignedUpAt } = await getClerkUserDetails(userId);
  if (clerkSignedUpAt) {
    const updated = await ensureMemberForUser({ userId, signedUpAt: clerkSignedUpAt });
    return updated.signedUpAt ? new Date(updated.signedUpAt) : clerkSignedUpAt;
  }

  const trialStart = new Date();
  const updated = await ensureMemberForUser({ userId, signedUpAt: trialStart });
  return updated.signedUpAt ? new Date(updated.signedUpAt) : trialStart;
}

export async function getMemberAccessStatus(userId: string): Promise<MemberAccessStatus> {
  const member = await getMemberByUserId(userId);

  if (!member) {
    return {
      member: null,
      hasAccess: false,
      hasCompletedBillingSetup: false,
      isPaidSubscriber: false,
      isInFreeTrial: false,
      signedUpAt: null,
      trialEndsAt: null,
    };
  }

  const signedUpAt = await resolveSignedUpAt(member, userId);
  const trialEndsAt = getTrialEndsAt(signedUpAt);
  const isInFreeTrial = isWithinFreeTrial(signedUpAt);
  const isPaidSubscriber = member.isPaidSubscriber;

  // Access is based on persisted member state only. Clerk billing is synced on
  // /billing and /dashboard before redirecting, so we avoid billing ↔ dashboard loops.
  const hasAccess = isInFreeTrial || isPaidSubscriber;

  return {
    member,
    hasAccess,
    hasCompletedBillingSetup: true,
    isPaidSubscriber,
    isInFreeTrial,
    signedUpAt,
    trialEndsAt,
  };
}
