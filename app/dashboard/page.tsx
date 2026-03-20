import { SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getEventsUserIsAttending, getUpcomingEventsForUserGroups } from "@/db/queries/events";
import { getGroupsUserIsMemberOf, getPendingGroupsForApproval } from "@/db/queries/groups";
import { buttonVariants } from "@/components/ui/button";
import { LeaveGroupButton } from "@/app/group/[id]/LeaveGroupButton";
import { ensureMemberForUser, getMemberByUserId } from "@/db/queries/members";
import { getMessagesForUser } from "@/db/queries/messages";
import { ProfileCard } from "./ProfileCard";
import { MessagesTab } from "./MessagesTab";
import { PendingGroupsAdminTab } from "./PendingGroupsAdminTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;
  const requestedTab = typeof params.tab === "string" ? params.tab : "profile";
  const defaultTab = ["profile", "groups", "calendar", "events", "messages", "admin-approvals"].includes(
    requestedTab
  )
    ? requestedTab
    : "profile";

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Ensure we have a row in the members table for this user.
  await ensureMemberForUser({
    userId,
    email: user.primaryEmailAddress?.emailAddress ?? null,
    profilePicture: user.imageUrl ?? null,
  });

  const [allAttendingEvents, memberGroups, member, messages, calendarEvents] = await Promise.all([
    getEventsUserIsAttending(userId),
    getGroupsUserIsMemberOf(userId),
    getMemberByUserId(userId),
    getMessagesForUser(userId),
    getUpcomingEventsForUserGroups(userId),
  ]);

  const now = new Date();
  const attendingEvents = allAttendingEvents.filter(
    (e) => new Date(e.eventDate) >= now
  );

  const sortedMemberGroups = [...memberGroups].sort((a, b) => {
    const aIsOwner = a.ownerId === userId;
    const bIsOwner = b.ownerId === userId;
    if (aIsOwner && !bIsOwner) return -1;
    if (!aIsOwner && bIsOwner) return 1;
    return a.name.localeCompare(b.name);
  });

  const welcomeName =
    user.firstName?.trim() ||
    user.emailAddresses?.[0]?.emailAddress ||
    "there";
  const primaryEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase() ?? "";
  const isGroupApprover = primaryEmail === "jacqueline@letsmeet.uk";
  const pendingGroups = isGroupApprover ? await getPendingGroupsForApproval() : [];
  const pendingGroupsForTab = pendingGroups.map((group) => ({
    ...group,
    createdAt: group.createdAt.toISOString(),
  }));

  return (
    <div className="container mx-auto max-w-screen-2xl flex flex-col items-center px-4 py-8">
      <SignedIn>
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Welcome {welcomeName}. Manage your groups and events from here.
            </p>
          </div>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full justify-start">
              <TabsTrigger value="profile">Your profile</TabsTrigger>
              <TabsTrigger value="groups">Groups you&apos;re in</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="events">Events you&apos;re signed up for</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              {isGroupApprover ? (
                <TabsTrigger value="admin-approvals">Admin approvals</TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="profile">
              <ProfileCard member={member} />
            </TabsContent>

            <TabsContent value="groups">
              <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
                <h2 className="text-xl font-medium">Groups you&apos;re in</h2>
                {sortedMemberGroups.length === 0 ? (
                  <p className="text-muted-foreground mt-2 text-base">
                    You&apos;re not in any groups yet. Search groups to find one to join.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {sortedMemberGroups.map((group) => (
                      <li
                        key={group.id}
                        className="flex items-center gap-3 rounded-md border border-border/40 bg-background p-3 text-base"
                      >
                        {group.profilePicture ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            <img
                              src={group.profilePicture}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground text-xl">
                            —
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/group/${group.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {group.name}
                          </Link>
                          <span className="text-muted-foreground ml-2 text-sm">
                            {group.city}
                            {group.ownerId === userId ? " · You own this group" : null}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {group.ownerId !== userId ? (
                            <LeaveGroupButton
                              groupId={group.id}
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                            />
                          ) : null}
                          <Link
                            href={`/group/${group.id}`}
                            className={buttonVariants({ variant: "secondary", size: "sm", className: "scale-110" })}
                          >
                            View
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>

            <TabsContent value="events">
              <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
                <h2 className="text-xl font-medium">Events you&apos;re signed up for</h2>
                {attendingEvents.length === 0 ? (
                  <p className="text-muted-foreground mt-2 text-base">
                    You haven&apos;t signed up for any events yet. Browse groups to find events.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {attendingEvents.map((event) => (
                      <li
                        key={event.id}
                        className="flex flex-col gap-0.5 rounded-md border border-border/40 bg-background p-3 text-base"
                      >
                        <Link
                          href={`/group/${event.groupId}/event/${event.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {event.name}
                        </Link>
                        <span className="text-muted-foreground text-sm">
                          {event.groupName}
                        </span>
                        <span className="text-muted-foreground text-base">
                          {new Date(event.eventDate).toLocaleString()}
                          {event.location ? ` · ${event.location}` : ""}
                        </span>
                        <Link
                          href={`/group/${event.groupId}/event/${event.id}`}
                          className={buttonVariants({ variant: "secondary", size: "sm", className: "scale-110 w-fit self-end" })}
                        >
                          View event
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>

            <TabsContent value="calendar">
              <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
                <h2 className="text-xl font-medium">Upcoming events from your groups</h2>
                {calendarEvents.length === 0 ? (
                  <p className="text-muted-foreground mt-2 text-base">
                    There are no upcoming events in your groups yet.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {calendarEvents.map((event) => (
                      <li
                        key={event.id}
                        className="flex flex-col gap-0.5 rounded-md border border-border/40 bg-background p-3 text-base"
                      >
                        <Link
                          href={`/group/${event.groupId}/event/${event.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {event.name}
                        </Link>
                        <span className="text-muted-foreground text-sm">
                          {event.groupName}
                        </span>
                        <span className="text-muted-foreground text-base">
                          {new Date(event.eventDate).toLocaleString()}
                          {event.location ? ` · ${event.location}` : ""}
                        </span>
                        <span
                          className={
                            event.isSignedUp
                              ? "mt-1 w-fit rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                              : "mt-1 w-fit rounded-full border border-border/60 bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                          }
                        >
                          {event.isSignedUp
                            ? "You are signed up"
                            : "You are not signed up"}
                        </span>
                        <Link
                          href={`/group/${event.groupId}/event/${event.id}`}
                          className={buttonVariants({ variant: "secondary", size: "sm", className: "scale-110 w-fit self-end" })}
                        >
                          View event
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TabsContent>

            <TabsContent value="messages">
              <MessagesTab messages={messages} currentUserId={userId} />
            </TabsContent>

            {isGroupApprover ? (
              <TabsContent value="admin-approvals">
                <PendingGroupsAdminTab pendingGroups={pendingGroupsForTab} />
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground max-w-sm">
            Sign in to access your dashboard and manage your groups and events.
          </p>
          <Link
            href="/"
            className="text-lg font-medium text-primary underline-offset-4 hover:underline scale-110 inline-block"
          >
            Back to home
          </Link>
        </div>
      </SignedOut>
    </div>
  );
}
