"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addEventNote, type AddEventNoteResult } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddEventNoteFormProps = {
  eventId: number;
};

export function AddEventNoteForm({ eventId }: AddEventNoteFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const trimmed = content.trim();
    if (!trimmed) {
      setError("Note cannot be empty.");
      return;
    }
    setIsSubmitting(true);
    const result: AddEventNoteResult = await addEventNote({ eventId, content: trimmed });
    setIsSubmitting(false);
    if (result.success) {
      setContent("");
      router.refresh();
      return;
    }
    setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Label htmlFor="event-note-content" className="sr-only">
        Add a note
      </Label>
      <div className="flex flex-wrap items-end gap-2">
        <Input
          id="event-note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note for this event…"
          disabled={isSubmitting}
          maxLength={2000}
          className="min-w-[200px] flex-1"
        />
        <Button type="submit" size="default" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Adding…" : "Add note"}
        </Button>
      </div>
      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
