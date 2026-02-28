import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getApprovedGroup,
  getGroupMemberCount,
  isUserGroupMember,
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

  const [events, memberCount, isMember, attendeeCounts, attendingEventIds] =
    await Promise.all([
      getEventsByGroupId(groupId),
      getGroupMemberCount(groupId),
      isUserGroupMember(groupId, userId),
      getAttendeeCountsForGroupEvents(groupId),
      getEventIdsUserAttendingInGroup(groupId, userId),
    ]);

  let ownerName: string = "Unknown";
  try {
    const client = await clerkClient();
    const owner = await client.users.getUser(group.ownerId);
    ownerName = owner.firstName ?? "Unknown";
  } catch {
    // keep "Unknown" if Clerk lookup fails
  }

  return (
    <div className="container max-w-screen-2xl flex flex-col items-center px-4 py-8">
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
                <Image
                  src={group.profilePicture}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
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
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Events ({events.length})</h2>
            {userId === group.ownerId ? (
              <AddEventDialog groupId={groupId} />
            ) : null}
          </div>
          {events.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">No events yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {events.map((event) => (
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
      </div>
    </div>
  );
}
