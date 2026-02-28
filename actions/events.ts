"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getApprovedGroup, isUserGroupMember } from "@/db/queries/groups";
import {
  getEventById,
  insertEvent,
  insertEventAttendee,
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

  await insertEventAttendee({ eventId: parsed.data.eventId, userId });
  revalidatePath(`/group/${event.groupId}`);

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
