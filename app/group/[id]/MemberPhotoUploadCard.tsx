"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadGroupMemberPhotos } from "@/actions/group-member-photos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MAX_IMAGE_UPLOAD_BYTES,
  fileToCompressedDataUrl,
} from "@/lib/image-data-url";

type MemberPhotoUploadCardProps = {
  groupId: number;
};

export function MemberPhotoUploadCard({ groupId }: MemberPhotoUploadCardProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const input = form.elements.namedItem("photos") as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];

    if (!files.length) {
      setError("Select at least one image.");
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Only image files can be uploaded.");
        return;
      }
      if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        setError("Each photo must be 2MB or smaller.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const photos = await Promise.all(
        files.map((file) => fileToCompressedDataUrl(file))
      );
      const result = await uploadGroupMemberPhotos({ groupId, photos });
      if (!result.success) {
        setError(result.error);
        return;
      }

      form.reset();
      setSuccess("Photos uploaded.");
      router.refresh();
    } catch {
      setError("Could not process one or more images. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-lg font-medium">Group photos</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Upload one or more photos to share with members. Max 2MB per image;
        photos are compressed before saving.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <Input id="group-photos" name="photos" type="file" accept="image/*" multiple />
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-emerald-700 text-sm dark:text-emerald-300" role="status">
            {success}
          </p>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Uploading..." : "Upload photos"}
        </Button>
      </form>
    </div>
  );
}
