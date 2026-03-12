import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getEventsUserIsAttending } from "@/db/queries/events";
import { getGroupsUserIsMemberOf } from "@/db/queries/groups";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const [attendingEvents, memberGroups] = await Promise.all([
    getEventsUserIsAttending(userId),
    getGroupsUserIsMemberOf(userId),
  ]);

  return (
    <div className="container max-w-screen-2xl flex flex-col items-center px-4 py-8">
      <SignedIn>
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Welcome back. Manage your groups and events from here.
            </p>
          </div>

          <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-xl font-medium">Groups you&apos;re in</h2>
            {memberGroups.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-base">
                You&apos;re not in any groups yet. Search groups to find one to join.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {memberGroups.map((group) => (
                  <li
                    key={group.id}
                    className="flex items-center gap-3 rounded-md border border-border/40 bg-background p-3 text-base"
                  >
                    {group.profilePicture ? (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={group.profilePicture}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
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
                    <Link
                      href={`/group/${group.id}`}
                      className={buttonVariants({ variant: "secondary", size: "sm", className: "scale-110" })}
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
