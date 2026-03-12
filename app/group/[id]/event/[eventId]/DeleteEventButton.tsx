"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteEvent, type DeleteEventResult } from "@/actions/events";
import { Button } from "@/components/ui/button";

type DeleteEventButtonProps = {
  groupId: number;
  eventId: number;
};

export function DeleteEventButton({ groupId, eventId }: DeleteEventButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const ok = window.confirm(
      "Delete this event? This will remove the event and all attendee sign-ups."
    );
    if (!ok) return;

    setError(null);
    setIsSubmitting(true);
    const result: DeleteEventResult = await deleteEvent({ eventId });
    setIsSubmitting(false);

    if (result.success) {
      router.push(`/group/${groupId}`);
      router.refresh();
      return;
    }

    setError(result.error);
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="destructive"
        size="sm"
        className="w-fit"
        onClick={handleDelete}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Deleting…" : "Delete event"}
      </Button>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

