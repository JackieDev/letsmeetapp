import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUpcomingEventsForUserGroups } from "@/db/queries/events";
import { buttonVariants } from "@/components/ui/button";

export default async function CalendarPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const calendarEvents = await getUpcomingEventsForUserGroups(userId);

  return (
    <div className="container mx-auto max-w-screen-2xl flex flex-col items-center px-4 py-8">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Upcoming events from your groups.
          </p>
        </div>

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
                    className={buttonVariants({
                      variant: "secondary",
                      size: "sm",
                      className: "scale-110 w-fit self-end",
                    })}
                  >
                    View event
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
