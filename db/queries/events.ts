import { and, eq, gte, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  eventAttendeesTable,
  eventNotesTable,
  eventsTable,
  groupMembersTable,
  groupsTable,
} from "@/db/schema";

export type Event = typeof eventsTable.$inferSelect;
export type EventInsert = typeof eventsTable.$inferInsert;

/** Get a single event by id. Returns null if not found. */
export async function getEventById(eventId: number) {
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, eventId));
  return event ?? null;
}

/** Get all events for a group, ordered by event date ascending. */
export async function getEventsByGroupId(groupId: number) {
  return db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.groupId, groupId))
    .orderBy(eventsTable.eventDate);
}

/** Create a new event. Returns the created event (with id). */
export async function insertEvent(data: {
  groupId: number;
  name: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  organizerId: string;
  attendeeLimit: number | null;
}) {
  const [event] = await db.insert(eventsTable).values(data).returning();
  return event!;
}

/** Add an attendee to an event. */
export async function insertEventAttendee(data: {
  eventId: number;
  userId: string;
  comments?: string | null;
}) {
  await db.insert(eventAttendeesTable).values({
    eventId: data.eventId,
    userId: data.userId,
    comments: data.comments ?? null,
  });
}

/** Get attendee counts for all events in a group. Returns map of eventId -> count. */
export async function getAttendeeCountsForGroupEvents(groupId: number) {
  const rows = await db
    .select({
      eventId: eventAttendeesTable.eventId,
      count: sql<number>`count(*)::int`,
    })
    .from(eventAttendeesTable)
    .innerJoin(eventsTable, eq(eventsTable.id, eventAttendeesTable.eventId))
    .where(eq(eventsTable.groupId, groupId))
    .groupBy(eventAttendeesTable.eventId);
  return new Map(rows.map((r) => [r.eventId, r.count]));
}

/** Get all events the user is signed up for, ordered by event date ascending. */
export async function getEventsUserIsAttending(userId: string) {
  return db
    .select({
      id: eventsTable.id,
      groupId: eventsTable.groupId,
      groupName: groupsTable.name,
      name: eventsTable.name,
      description: eventsTable.description,
      eventDate: eventsTable.eventDate,
      location: eventsTable.location,
    })
    .from(eventAttendeesTable)
    .innerJoin(eventsTable, eq(eventsTable.id, eventAttendeesTable.eventId))
    .innerJoin(groupsTable, eq(groupsTable.id, eventsTable.groupId))
    .where(eq(eventAttendeesTable.userId, userId))
    .orderBy(eventsTable.eventDate);
}

/** Get upcoming events in all approved groups the user belongs to, with signup status. */
export async function getUpcomingEventsForUserGroups(userId: string) {
  return db
    .select({
      id: eventsTable.id,
      groupId: eventsTable.groupId,
      groupName: groupsTable.name,
      name: eventsTable.name,
      description: eventsTable.description,
      eventDate: eventsTable.eventDate,
      location: eventsTable.location,
      isSignedUp: sql<boolean>`${eventAttendeesTable.id} is not null`,
    })
    .from(eventsTable)
    .innerJoin(groupsTable, eq(groupsTable.id, eventsTable.groupId))
    .leftJoin(
      eventAttendeesTable,
      and(
        eq(eventAttendeesTable.eventId, eventsTable.id),
        eq(eventAttendeesTable.userId, userId)
      )
    )
    .where(
      and(
        eq(groupsTable.isApproved, true),
        gte(eventsTable.eventDate, new Date()),
        or(
          eq(groupsTable.ownerId, userId),
          sql<boolean>`exists (
            select 1
            from ${groupMembersTable}
            where ${groupMembersTable.groupId} = ${groupsTable.id}
              and ${groupMembersTable.userId} = ${userId}
              and ${groupMembersTable.isBanned} = false
              and ${groupMembersTable.isMemberApproved} = true
          )`
        )
      )
    )
    .orderBy(eventsTable.eventDate);
}

/** Get event IDs (in this group) that the user is attending. */
export async function getEventIdsUserAttendingInGroup(
  groupId: number,
  userId: string
) {
  const rows = await db
    .select({ eventId: eventAttendeesTable.eventId })
    .from(eventAttendeesTable)
    .innerJoin(eventsTable, eq(eventsTable.id, eventAttendeesTable.eventId))
    .where(
      and(
        eq(eventsTable.groupId, groupId),
        eq(eventAttendeesTable.userId, userId)
      )
    );
  return new Set(rows.map((r) => r.eventId));
}

/** True if the user is already an attendee of the event. */
export async function isUserAttendingEvent(eventId: number, userId: string) {
  const [row] = await db
    .select({ id: eventAttendeesTable.id })
    .from(eventAttendeesTable)
    .where(
      and(
        eq(eventAttendeesTable.eventId, eventId),
        eq(eventAttendeesTable.userId, userId)
      )
    );
  return !!row;
}

/** Delete an event by id. */
export async function deleteEventById(eventId: number) {
  await db.delete(eventsTable).where(eq(eventsTable.id, eventId));
}

/** Get all attendees for an event, ordered by signedUpAt. */
export async function getAttendeesByEventId(eventId: number) {
  return db
    .select({
      userId: eventAttendeesTable.userId,
      signedUpAt: eventAttendeesTable.signedUpAt,
      comments: eventAttendeesTable.comments,
    })
    .from(eventAttendeesTable)
    .where(eq(eventAttendeesTable.eventId, eventId))
    .orderBy(eventAttendeesTable.signedUpAt);
}

/** Remove an attendee from an event. */
export async function deleteEventAttendee(eventId: number, userId: string) {
  await db
    .delete(eventAttendeesTable)
    .where(
      and(
        eq(eventAttendeesTable.eventId, eventId),
        eq(eventAttendeesTable.userId, userId)
      )
  );
}

/** Set attendeeLimit for all events where it is currently null. Returns number of rows updated. */
export async function setAttendeeLimitWhereNull(limit: number) {
  const updated = await db
    .update(eventsTable)
    .set({ attendeeLimit: limit })
    .where(isNull(eventsTable.attendeeLimit))
    .returning({ id: eventsTable.id });
  return updated.length;
}

/** Get all notes for an event, ordered by createdAt ascending. */
export async function getEventNotesByEventId(eventId: number) {
  return db
    .select({
      id: eventNotesTable.id,
      userId: eventNotesTable.userId,
      content: eventNotesTable.content,
      createdAt: eventNotesTable.createdAt,
    })
    .from(eventNotesTable)
    .where(eq(eventNotesTable.eventId, eventId))
    .orderBy(eventNotesTable.createdAt);
}

/** Add a note to an event. Caller must ensure the user is an attendee. */
export async function insertEventNote(data: {
  eventId: number;
  userId: string;
  content: string;
}) {
  await db.insert(eventNotesTable).values({
    eventId: data.eventId,
    userId: data.userId,
    content: data.content,
  });
}
