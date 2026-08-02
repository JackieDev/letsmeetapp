"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closeOwnedGroup, updateOwnedGroupDetails } from "@/actions/groups";
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
import {
  MAX_IMAGE_UPLOAD_BYTES,
  fileToCompressedDataUrl,
} from "@/lib/image-data-url";

const MAX_OBLIGATORY_QUESTIONS = 5;

type ManageGroupDialogProps = {
  groupId: number;
  initialName: string;
  initialKeywords: string | null;
  initialObligatoryQuestions: string[];
  /** Remote URL only — uploaded data URLs must not be passed to the client. */
  initialProfilePictureUrl: string | null;
  hasUploadedProfilePicture: boolean;
};

export function ManageGroupDialog({
  groupId,
  initialName,
  initialKeywords,
  initialObligatoryQuestions,
  initialProfilePictureUrl,
  hasUploadedProfilePicture,
}: ManageGroupDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [keywords, setKeywords] = useState(initialKeywords ?? "");
  const [obligatoryQuestions, setObligatoryQuestions] = useState(
    initialObligatoryQuestions
  );
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    initialProfilePictureUrl ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setName(initialName);
      setKeywords(initialKeywords ?? "");
      setObligatoryQuestions(initialObligatoryQuestions);
      setProfilePictureUrl(initialProfilePictureUrl ?? "");
      setError(null);
    }
  }

  function addQuestion() {
    if (obligatoryQuestions.length >= MAX_OBLIGATORY_QUESTIONS) return;
    setObligatoryQuestions((prev) => [...prev, ""]);
  }

  function updateQuestion(index: number, value: string) {
    setObligatoryQuestions((prev) =>
      prev.map((question, i) => (i === index ? value : question))
    );
  }

  function removeQuestion(index: number) {
    setObligatoryQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const form = e.currentTarget;
    const uploadedFile = (form.elements.namedItem("groupProfilePictureFile") as HTMLInputElement)
      ?.files?.[0];

    let profilePicture: string | undefined;
    if (uploadedFile) {
      if (!uploadedFile.type.startsWith("image/")) {
        setIsSaving(false);
        setError("Please upload an image file.");
        return;
      }
      if (uploadedFile.size > MAX_IMAGE_UPLOAD_BYTES) {
        setIsSaving(false);
        setError("Uploaded image must be 2MB or smaller.");
        return;
      }

      try {
        profilePicture = await fileToCompressedDataUrl(uploadedFile);
      } catch {
        setIsSaving(false);
        setError("Could not process uploaded image. Please try again.");
        return;
      }
    } else {
      const trimmedUrl = profilePictureUrl.trim();
      const originalUrl = (initialProfilePictureUrl ?? "").trim();
      if (trimmedUrl !== originalUrl) {
        profilePicture = trimmedUrl;
      }
    }

    const questions = obligatoryQuestions.map((q) => q.trim()).filter(Boolean);

    const result = await updateOwnedGroupDetails({
      groupId,
      name,
      keywords,
      obligatoryQuestions: questions,
      ...(profilePicture !== undefined ? { profilePicture } : {}),
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  async function handleCloseGroup() {
    const confirmed = window.confirm(
      "Close this group permanently? This will remove the group, members, and events."
    );
    if (!confirmed) return;

    setError(null);
    setIsClosing(true);

    const result = await closeOwnedGroup({ groupId });

    setIsClosing(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          Manage group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Group settings</DialogTitle>
          <DialogDescription>
            Update your group details, or close the group permanently.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              required
              disabled={isSaving || isClosing}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="group-keywords">Keywords (optional)</Label>
            <Input
              id="group-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. hiking, outdoors, beginners"
              disabled={isSaving || isClosing}
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated terms others can search for.
            </p>
          </div>
          <div className="grid gap-2">
            <Label>Obligatory join questions (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Ask up to {MAX_OBLIGATORY_QUESTIONS} questions that future members
              must answer when joining.
            </p>
            {obligatoryQuestions.length > 0 ? (
              <div className="grid gap-3">
                {obligatoryQuestions.map((question, index) => (
                  <div key={index} className="grid gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`manage-question-${index}`}>
                        Question {index + 1}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(index)}
                        disabled={isSaving || isClosing}
                      >
                        Remove
                      </Button>
                    </div>
                    <Input
                      id={`manage-question-${index}`}
                      value={question}
                      onChange={(e) => updateQuestion(index, e.target.value)}
                      placeholder="e.g. Why do you want to join?"
                      maxLength={500}
                      disabled={isSaving || isClosing}
                    />
                  </div>
                ))}
              </div>
            ) : null}
            {obligatoryQuestions.length < MAX_OBLIGATORY_QUESTIONS ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
                disabled={isSaving || isClosing}
                className="w-fit"
              >
                Add question
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                Maximum of {MAX_OBLIGATORY_QUESTIONS} questions reached.
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="group-profile-picture">Group picture URL (optional)</Label>
            <Input
              id="group-profile-picture"
              value={profilePictureUrl}
              onChange={(e) => setProfilePictureUrl(e.target.value)}
              placeholder="https://example.com/group-image.jpg"
              disabled={isSaving || isClosing}
            />
            {hasUploadedProfilePicture ? (
              <p className="text-xs text-muted-foreground">
                This group already has an uploaded picture. Leave the URL blank to keep it,
                or upload a new image to replace it.
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="group-profile-picture-file">
              Upload group picture (optional)
            </Label>
            <Input
              id="group-profile-picture-file"
              name="groupProfilePictureFile"
              type="file"
              accept="image/*"
              disabled={isSaving || isClosing}
            />
            <p className="text-xs text-muted-foreground">
              If both URL and upload are provided, the uploaded image is used.
              Images are compressed before upload (max 2MB source file).
            </p>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving || isClosing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isClosing}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>

        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-sm font-medium text-foreground">Danger zone</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Closing the group is permanent and cannot be undone.
          </p>
          <Button
            type="button"
            variant="destructive"
            className="mt-3"
            onClick={handleCloseGroup}
            disabled={isSaving || isClosing}
          >
            {isClosing ? "Closing..." : "Close group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
