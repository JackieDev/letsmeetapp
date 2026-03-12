import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getApprovedGroup } from "@/db/queries/groups";
import {
  getEventById,
  getAttendeesByEventId,
  getEventNotesByEventId,
} from "@/db/queries/events";
import { buttonVariants } from "@/components/ui/button";
import { AddEventNoteForm } from "./AddEventNoteForm";
import { CancelAttendanceButton } from "./CancelAttendanceButton";
import { DeleteEventButton } from "./DeleteEventButton";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string; eventId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const { id, eventId: eventIdParam } = await params;
  const groupId = Number(id);
  const eventId = Number(eventIdParam);
  if (Number.isNaN(groupId) || Number.isNaN(eventId)) {
    notFound();
  }

  const [group, event] = await Promise.all([
    getApprovedGroup(groupId),
    getEventById(eventId),
  ]);

  if (!group || !event || event.groupId !== groupId) {
    notFound();
  }

  const [attendees, notes] = await Promise.all([
    getAttendeesByEventId(eventId),
    getEventNotesByEventId(eventId),
  ]);
  const isCurrentUserAttending = attendees.some((a) => a.userId === userId);
  const isCurrentUserOrganizer = event.organizerId === userId;

  const noteAuthorIds = [...new Set(notes.map((n) => n.userId))];
  const allUserIds = [...new Set([...attendees.map((a) => a.userId), ...noteAuthorIds])];
  const attendeeNames: Record<string, string> = {};
  try {
    const client = await clerkClient();
    await Promise.all(
      allUserIds.map(async (uid) => {
        try {
          const user = await client.users.getUser(uid);
          attendeeNames[uid] =
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.emailAddresses[0]?.emailAddress ||
            "Unknown";
        } catch {
          attendeeNames[uid] = "Unknown";
        }
      })
    );
  } catch {
    allUserIds.forEach((uid) => {
      if (!attendeeNames[uid]) attendeeNames[uid] = "Unknown";
    });
  }

  return (
    <div className="container max-w-screen-2xl flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/group/${groupId}`}
            className={buttonVariants({ variant: "outline", size: "default" })}
          >
            Back to group
          </Link>
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{event.name}</h1>
          {event.description ? (
            <p className="text-muted-foreground mt-2 text-sm">{event.description}</p>
          ) : null}
          <dl className="text-muted-foreground mt-4 flex flex-col gap-1 text-sm">
            <span>
              <span className="font-medium text-foreground">Date & time:</span>{" "}
              {new Date(event.eventDate).toLocaleString()}
            </span>
            {event.location ? (
              <span>
                <span className="font-medium text-foreground">Location:</span>{" "}
                {event.location}
              </span>
            ) : null}
          </dl>
          {isCurrentUserAttending && (
            <div className="mt-4">
              <CancelAttendanceButton eventId={eventId} />
            </div>
          )}
          {isCurrentUserOrganizer && (
            <div className="mt-4">
              <DeleteEventButton groupId={groupId} eventId={eventId} />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-medium">
            Signed up (
            {event.attendeeLimit != null
              ? `${attendees.length} / ${event.attendeeLimit}`
              : attendees.length}
            )
          </h2>
          {attendees.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">
              No attendees yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {attendees.map((a) => (
                <li
                  key={a.userId}
                  className="flex flex-col gap-0.5 rounded-md border border-border/40 bg-background p-3 text-sm"
                >
                  <span className="font-medium">
                    {attendeeNames[a.userId] ?? "Unknown"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Signed up {new Date(a.signedUpAt).toLocaleString()}
                  </span>
                  {a.comments ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {a.comments}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-medium">Event notes</h2>
          {isCurrentUserAttending && (
            <div className="mt-3">
              <AddEventNoteForm eventId={eventId} />
            </div>
          )}
          {notes.length === 0 ? (
            <p className="text-muted-foreground mt-3 text-sm">
              No notes yet.
              {!isCurrentUserAttending && " Sign up to add a note."}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="flex flex-col gap-0.5 rounded-md border border-border/40 bg-background p-3 text-sm"
                >
                  <span className="font-medium">
                    {attendeeNames[note.userId] ?? "Unknown"}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                  <p className="mt-1 whitespace-pre-wrap">{note.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
