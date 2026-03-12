"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getApprovedGroup,
  isUserGroupMember,
  isUserBannedFromGroup,
} from "@/db/queries/groups";
import {
  getEventById,
  getAttendeesByEventId,
  insertEvent,
  insertEventAttendee,
  insertEventNote,
  isUserAttendingEvent,
  deleteEventAttendee,
  deleteEventById,
} from "@/db/queries/events";

const createEventSchema = z.object({
  groupId: z.number().int().positive(),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional(),
  eventDate: z.string().min(1, "Date is required"),
  location: z.string().max(500).optional(),
  attendeeLimit: z.number().int().positive().optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export type CreateEventResult =
  | { success: true }
  | { success: false; error: string };

export async function createEvent(
  input: CreateEventInput
): Promise<CreateEventResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to create an event." };
  }

  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    const message =
      [
        flattened.name?.[0],
        flattened.eventDate?.[0],
        flattened.description?.[0],
        flattened.location?.[0],
      ]
        .filter(Boolean)
        .join(" ") || "Invalid input.";
    return { success: false, error: message };
  }

  const group = await getApprovedGroup(parsed.data.groupId);
  if (!group) {
    return { success: false, error: "Group not found." };
  }
  if (group.ownerId !== userId) {
    return { success: false, error: "Only the group owner can add events." };
  }

  const eventDate = new Date(parsed.data.eventDate);
  if (Number.isNaN(eventDate.getTime())) {
    return { success: false, error: "Invalid date." };
  }
  if (eventDate.getTime() <= Date.now()) {
    return { success: false, error: "Event date must be in the future." };
  }

  const event = await insertEvent({
    groupId: parsed.data.groupId,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    eventDate,
    location: parsed.data.location ?? null,
    organizerId: userId,
    attendeeLimit: parsed.data.attendeeLimit ?? null,
  });

  await insertEventAttendee({ eventId: event.id, userId });

  revalidatePath(`/group/${parsed.data.groupId}`);

  return { success: true };
}

const attendEventSchema = z.object({
  eventId: z.number().int().positive(),
});

export type AttendEventInput = z.infer<typeof attendEventSchema>;

export type AttendEventResult =
  | { success: true }
  | { success: false; error: string };

export async function attendEvent(
  input: AttendEventInput
): Promise<AttendEventResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to attend an event." };
  }

  const parsed = attendEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid event." };
  }

  const event = await getEventById(parsed.data.eventId);
  if (!event) {
    return { success: false, error: "Event not found." };
  }

  const isBanned = await isUserBannedFromGroup(event.groupId, userId);
  if (isBanned) {
    return {
      success: false,
      error: "You have been banned from this group and cannot attend its events.",
    };
  }

  const isMember = await isUserGroupMember(event.groupId, userId);
  if (!isMember) {
    return {
      success: false,
      error: "You can only sign up for events in groups you are a member of.",
    };
  }

  const alreadyAttending = await isUserAttendingEvent(parsed.data.eventId, userId);
  if (alreadyAttending) {
    return { success: false, error: "You are already signed up for this event." };
  }

  if (event.attendeeLimit != null) {
    const attendees = await getAttendeesByEventId(parsed.data.eventId);
    if (attendees.length >= event.attendeeLimit) {
      return {
        success: false,
        error: "This event has reached its attendee limit.",
      };
    }
  }

  await insertEventAttendee({ eventId: parsed.data.eventId, userId });
  revalidatePath(`/group/${event.groupId}`);
  revalidatePath(`/group/${event.groupId}/event/${event.id}`);

  return { success: true };
}

const cancelEventAttendanceSchema = z.object({
  eventId: z.number().int().positive(),
});

export type CancelEventAttendanceInput = z.infer<
  typeof cancelEventAttendanceSchema
>;

export type CancelEventAttendanceResult =
  | { success: true }
  | { success: false; error: string };

export async function cancelEventAttendance(
  input: CancelEventAttendanceInput
): Promise<CancelEventAttendanceResult> {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      error: "You must be signed in to cancel attendance.",
    };
  }

  const parsed = cancelEventAttendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid event." };
  }

  const event = await getEventById(parsed.data.eventId);
  if (!event) {
    return { success: false, error: "Event not found." };
  }

  const attending = await isUserAttendingEvent(parsed.data.eventId, userId);
  if (!attending) {
    return {
      success: false,
      error: "You are not signed up for this event.",
    };
  }

  await deleteEventAttendee(parsed.data.eventId, userId);
  revalidatePath(`/group/${event.groupId}`);
  revalidatePath(`/group/${event.groupId}/event/${event.id}`);

  return { success: true };
}

const deleteEventSchema = z.object({
  eventId: z.number().int().positive(),
});

export type DeleteEventInput = z.infer<typeof deleteEventSchema>;

export type DeleteEventResult =
  | { success: true }
  | { success: false; error: string };

export async function deleteEvent(
  input: DeleteEventInput
): Promise<DeleteEventResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to delete an event." };
  }

  const parsed = deleteEventSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid event." };
  }

  const event = await getEventById(parsed.data.eventId);
  if (!event) {
    return { success: false, error: "Event not found." };
  }

  if (event.organizerId !== userId) {
    return { success: false, error: "You can only delete events you created." };
  }

  await deleteEventById(event.id);
  revalidatePath(`/group/${event.groupId}`);

  return { success: true };
}

const addEventNoteSchema = z.object({
  eventId: z.number().int().positive(),
  content: z.string().min(1, "Note cannot be empty").max(2000),
});

export type AddEventNoteInput = z.infer<typeof addEventNoteSchema>;

export type AddEventNoteResult =
  | { success: true }
  | { success: false; error: string };

export async function addEventNote(
  input: AddEventNoteInput
): Promise<AddEventNoteResult> {
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: "You must be signed in to add a note." };
  }

  const parsed = addEventNoteSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors.content?.[0] ?? "Invalid input.";
    return { success: false, error: msg };
  }

  const event = await getEventById(parsed.data.eventId);
  if (!event) {
    return { success: false, error: "Event not found." };
  }

  const isAttendee = await isUserAttendingEvent(parsed.data.eventId, userId);
  if (!isAttendee) {
    return {
      success: false,
      error: "Only attendees can add notes to this event.",
    };
  }

  await insertEventNote({
    eventId: parsed.data.eventId,
    userId,
    content: parsed.data.content.trim(),
  });
  revalidatePath(`/group/${event.groupId}`);
  revalidatePath(`/group/${event.groupId}/event/${event.id}`);

  return { success: true };
}
