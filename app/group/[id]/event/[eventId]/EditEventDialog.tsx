"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEvent, type UpdateEventResult } from "@/actions/events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function toDatetimeLocalValue(date: Date | string) {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type EditEventDialogProps = {
  event: {
    id: number;
    name: string;
    description: string | null;
    eventDate: Date | string;
    location: string | null;
    attendeeLimit: number | null;
  };
};

export function EditEventDialog({ event }: EditEventDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const description = (
      form.elements.namedItem("description") as HTMLTextAreaElement
    ).value.trim();
    const eventDate = (form.elements.namedItem("eventDate") as HTMLInputElement)
      .value;
    const location = (
      form.elements.namedItem("location") as HTMLInputElement
    ).value.trim();
    const attendeeLimitRaw = (
      form.elements.namedItem("attendeeLimit") as HTMLInputElement
    ).value.trim();
    const attendeeLimit = attendeeLimitRaw
      ? parseInt(attendeeLimitRaw, 10)
      : undefined;
    if (
      attendeeLimit !== undefined &&
      (Number.isNaN(attendeeLimit) || attendeeLimit < 1)
    ) {
      setError("Max attendees must be a positive number.");
      setIsSubmitting(false);
      return;
    }

    if (!eventDate) {
      setError("Date and time are required.");
      setIsSubmitting(false);
      return;
    }

    const result: UpdateEventResult = await updateEvent({
      eventId: event.id,
      name,
      description: description || undefined,
      eventDate: new Date(eventDate).toISOString(),
      location: location || undefined,
      attendeeLimit,
    });

    setIsSubmitting(false);

    if (result.success) {
      setOpen(false);
      router.refresh();
      return;
    }

    setError(result.error);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
          <DialogDescription>
            Update the name, date, location, or other details for this event.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-event-name">Name</Label>
            <Input
              id="edit-event-name"
              name="name"
              defaultValue={event.name}
              placeholder="Event name"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-event-date">Date & time</Label>
            <Input
              id="edit-event-date"
              name="eventDate"
              type="datetime-local"
              defaultValue={toDatetimeLocalValue(event.eventDate)}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-event-location">Location (optional)</Label>
            <Input
              id="edit-event-location"
              name="location"
              defaultValue={event.location ?? ""}
              placeholder="Venue or address"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-event-attendee-limit">
              Max attendees (optional)
            </Label>
            <Input
              id="edit-event-attendee-limit"
              name="attendeeLimit"
              type="number"
              min={1}
              defaultValue={event.attendeeLimit ?? ""}
              placeholder="No limit"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-event-description">Description (optional)</Label>
            <textarea
              id="edit-event-description"
              name="description"
              rows={2}
              defaultValue={event.description ?? ""}
              placeholder="What's this event about?"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            />
          </div>
          {error && (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
