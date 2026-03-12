"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  attendEvent,
  cancelEventAttendance,
  type AttendEventResult,
  type CancelEventAttendanceResult,
} from "@/actions/events";
import type { Event } from "@/db/queries/events";
import { Button } from "@/components/ui/button";

type EventBoxProps = {
  event: Event;
  groupId: number;
  isMember: boolean;
  isAttending: boolean;
  attendeeCount: number;
};

export function EventBox({
  event,
  groupId,
  isMember,
  isAttending,
  attendeeCount,
}: EventBoxProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    setError(null);
    setIsSubmitting(true);
    const result: AttendEventResult = await attendEvent({ eventId: event.id });
    setIsSubmitting(false);
    if (result.success) {
      router.refresh();
      return;
    }
    setError(result.error);
  }

  async function handleCancel() {
    setError(null);
    setIsSubmitting(true);
    const result: CancelEventAttendanceResult = await cancelEventAttendance({
      eventId: event.id,
    });
    setIsSubmitting(false);
    if (result.success) {
      router.refresh();
      return;
    }
    setError(result.error);
  }

  return (
    <li className="flex flex-col gap-2 rounded-md border border-border/40 bg-background p-3 text-sm">
      <div className="flex flex-col gap-0.5">
        <Link
          href={`/group/${groupId}/event/${event.id}`}
          className="font-medium text-primary hover:underline"
        >
          {event.name}
        </Link>
        <span className="text-muted-foreground">
          {new Date(event.eventDate).toLocaleString()}
          {event.location ? ` · ${event.location}` : ""}
        </span>
        <span className="text-muted-foreground text-xs">
          {event.attendeeLimit != null
            ? `${attendeeCount} / ${event.attendeeLimit} ${event.attendeeLimit === 1 ? "attendee" : "attendees"}`
            : `${attendeeCount} ${attendeeCount === 1 ? "attendee" : "attendees"}`}
        </span>
      </div>
      {isMember && (
        <div className="flex flex-wrap items-center gap-2">
          {isAttending ? (
            <>
              <span className="text-muted-foreground text-xs font-medium">
                You&apos;re attending
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Cancelling…" : "Cancel attendance"}
              </Button>
              {error && (
                <p className="text-destructive text-xs w-full" role="alert">
                  {error}
                </p>
              )}
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSignUp}
                disabled={
                  isSubmitting ||
                  (event.attendeeLimit != null &&
                    attendeeCount >= event.attendeeLimit)
                }
              >
                {isSubmitting ? "Signing up…" : "Sign up"}
              </Button>
              {error && (
                <p className="text-destructive text-xs" role="alert">
                  {error}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}
