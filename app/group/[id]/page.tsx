import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getApprovedGroup,
  getGroupMemberCount,
  getGroupMembers,
  getApprovedGroupMembersWithProfiles,
  isUserGroupMember,
  isUserBannedFromGroup,
} from "@/db/queries/groups";
import {
  getAttendeeCountsForGroupEvents,
  getEventIdsUserAttendingInGroup,
  getEventsByGroupId,
} from "@/db/queries/events";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddEventDialog } from "./AddEventDialog";
import { EventBox } from "./EventBox";
import { ManageMembersDialog } from "./ManageMembersDialog";
import { ManageGroupDialog } from "./ManageGroupDialog";
import { JoinGroupButton } from "./JoinGroupButton";
import { LeaveGroupButton } from "./LeaveGroupButton";
import { ViewGroupMembersDialog } from "./ViewGroupMembersDialog";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const { id } = await params;
  const groupId = Number(id);
  if (Number.isNaN(groupId)) {
    notFound();
  }

  const group = await getApprovedGroup(groupId);
  if (!group) {
    notFound();
  }

  const [
    events,
    memberCount,
    isMember,
    attendeeCounts,
    attendingEventIds,
    members,
    approvedMembers,
    isBanned,
  ] = await Promise.all([
    getEventsByGroupId(groupId),
    getGroupMemberCount(groupId),
    isUserGroupMember(groupId, userId),
    getAttendeeCountsForGroupEvents(groupId),
    getEventIdsUserAttendingInGroup(groupId, userId),
    getGroupMembers(groupId),
    getApprovedGroupMembersWithProfiles(groupId),
    isUserBannedFromGroup(groupId, userId),
  ]);

  let ownerName: string = "Unknown";
  try {
    const client = await clerkClient();
    const owner = await client.users.getUser(group.ownerId);
    ownerName = owner.firstName ?? "Unknown";
  } catch {
    // keep "Unknown" if Clerk lookup fails
  }

  const isOwner = userId === group.ownerId;
  const currentMembership = members.find((m) => m.userId === userId) ?? null;
  const isPendingMembership =
    !!currentMembership &&
    !currentMembership.isBanned &&
    !currentMembership.isMemberApproved;

  const canJoinGroup = !isOwner && !isMember && !isBanned && !isPendingMembership;

  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.eventDate) >= now);
  const pastEvents = [...events.filter((e) => new Date(e.eventDate) < now)].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );

  return (
    <div className="container mx-auto max-w-screen-2xl flex flex-col items-center px-4 py-8">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/groups/search"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back to search
          </Link>
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {group.profilePicture ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={group.profilePicture}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-2xl">
                —
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
              {group.description ? (
                <p className="text-muted-foreground mt-1 text-sm">{group.description}</p>
              ) : null}
              <dl className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span>
                  <span className="font-medium text-foreground">City:</span> {group.city}
                </span>
                <span>
                  <span className="font-medium text-foreground">Owner:</span> {ownerName}
                </span>
                <span>
                  <span className="font-medium text-foreground">Members:</span> {memberCount}
                </span>
              </dl>
            </div>
            {isOwner ? (
              <div className="mt-4 flex shrink-0 flex-col gap-2 sm:mt-0 sm:flex-col">
                <ManageGroupDialog
                  groupId={groupId}
                  initialName={group.name}
                  initialProfilePicture={group.profilePicture}
                />
                <ViewGroupMembersDialog members={approvedMembers} />
                <ManageMembersDialog
                  groupId={groupId}
                  ownerId={group.ownerId}
                  currentUserId={userId}
                  members={members}
                  requiresMemberApproval={group.requiresMemberApproval}
                />
              </div>
            ) : canJoinGroup ? (
              <div className="mt-4 shrink-0 sm:mt-0">
                <JoinGroupButton groupId={groupId} />
              </div>
            ) : isPendingMembership ? (
              <div className="mt-4 shrink-0 sm:mt-0">
                <p className="text-muted-foreground text-sm">
                  Your request to join is pending approval.
                </p>
              </div>
            ) : isMember && !isOwner ? (
              <div className="mt-4 shrink-0 sm:mt-0">
                <ViewGroupMembersDialog members={approvedMembers} />
                <LeaveGroupButton groupId={groupId} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Upcoming events ({upcomingEvents.length})</h2>
            {userId === group.ownerId ? (
              <AddEventDialog groupId={groupId} />
            ) : null}
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">No upcoming events.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {upcomingEvents.map((event) => (
                <EventBox
                  key={event.id}
                  event={event}
                  groupId={groupId}
                  isMember={isMember}
                  isAttending={attendingEventIds.has(event.id)}
                  attendeeCount={attendeeCounts.get(event.id) ?? 0}
                />
              ))}
            </ul>
          )}
        </div>

        {pastEvents.length > 0 ? (
          <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-lg font-medium">Past events ({pastEvents.length})</h2>
            <ul className="mt-3 space-y-2">
              {pastEvents.map((event) => (
                <EventBox
                  key={event.id}
                  event={event}
                  groupId={groupId}
                  isMember={isMember}
                  isAttending={attendingEventIds.has(event.id)}
                  attendeeCount={attendeeCounts.get(event.id) ?? 0}
                  isPast
                />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
