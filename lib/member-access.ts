import { redirect } from "next/navigation";
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
  isPaused: boolean;
  isCanceled: boolean;
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
      isPaused: false,
      isCanceled: false,
      signedUpAt: null,
      trialEndsAt: null,
    };
  }

  const signedUpAt = await resolveSignedUpAt(member, userId);
  const trialEndsAt = getTrialEndsAt(signedUpAt);
  const isInFreeTrial = isWithinFreeTrial(signedUpAt);
  const isPaidSubscriber = member.isPaidSubscriber;
  const isPaused = member.accountPausedAt != null;
  const isCanceled = member.accountCanceledAt != null;

  // Access is based on persisted member state only. Clerk billing is synced on
  // /billing and /dashboard before redirecting, so we avoid billing ↔ dashboard loops.
  // A pause blocks access immediately. A cancel ends the free trial, but a paid
  // period that has not finished still grants access.
  const hasAccess = isPaused
    ? false
    : isCanceled
      ? isPaidSubscriber
      : isInFreeTrial || isPaidSubscriber;

  return {
    member,
    hasAccess,
    hasCompletedBillingSetup: true,
    isPaidSubscriber,
    isInFreeTrial,
    isPaused,
    isCanceled,
    signedUpAt,
    trialEndsAt,
  };
}

/** Why a member cannot use the app, or null when their account is open. */
export async function getAccountClosedMessage(userId: string): Promise<string | null> {
  const access = await getMemberAccessStatus(userId);
  if (access.isPaused) {
    return "Your account is paused. Resume it on the billing page.";
  }
  if (access.isCanceled && !access.hasAccess) {
    return "Your account is canceled. Subscribe again on the billing page to continue.";
  }
  return null;
}

/** Send a paused or fully canceled member back to billing. */
export async function redirectIfAccountClosed(userId: string) {
  const message = await getAccountClosedMessage(userId);
  if (message) redirect("/billing");
}
