"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  cancelEventAttendance,
  type CancelEventAttendanceResult,
} from "@/actions/events";
import { Button } from "@/components/ui/button";

type CancelAttendanceButtonProps = {
  eventId: number;
};

export function CancelAttendanceButton({ eventId }: CancelAttendanceButtonProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setError(null);
    setIsSubmitting(true);
    const result: CancelEventAttendanceResult = await cancelEventAttendance({
      eventId,
    });
    setIsSubmitting(false);
    if (result.success) {
      router.refresh();
      return;
    }
    setError(result.error);
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        size="default"
        className="w-fit"
        onClick={handleCancel}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Cancelling…" : "Cancel attendance"}
      </Button>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
