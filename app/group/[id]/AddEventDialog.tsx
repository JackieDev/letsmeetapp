"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, type CreateEventResult } from "@/actions/events";
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

type AddEventDialogProps = {
  groupId: number;
};

export function AddEventDialog({ groupId }: AddEventDialogProps) {
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
    const description = (form.elements.namedItem("description") as HTMLInputElement).value.trim();
    const eventDate = (form.elements.namedItem("eventDate") as HTMLInputElement).value;
    const location = (form.elements.namedItem("location") as HTMLInputElement).value.trim();

    if (!eventDate) {
      setError("Date and time are required.");
      setIsSubmitting(false);
      return;
    }

    // datetime-local gives "YYYY-MM-DDTHH:mm", convert to ISO for server
    const result: CreateEventResult = await createEvent({
      groupId,
      name,
      description: description || undefined,
      eventDate: new Date(eventDate).toISOString(),
      location: location || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      setOpen(false);
      router.refresh();
      form.reset();
      return;
    }

    setError(result.error);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Add event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
          <DialogDescription>
            Create a new event for this group. Set the name, date, and optional location.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="event-name">Name</Label>
            <Input
              id="event-name"
              name="name"
              placeholder="Event name"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-date">Date & time</Label>
            <Input
              id="event-date"
              name="eventDate"
              type="datetime-local"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-location">Location (optional)</Label>
            <Input
              id="event-location"
              name="location"
              placeholder="Venue or address"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-description">Description (optional)</Label>
            <textarea
              id="event-description"
              name="description"
              rows={2}
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
              {isSubmitting ? "Creating…" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
