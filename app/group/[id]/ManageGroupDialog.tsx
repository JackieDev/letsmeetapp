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

type ManageGroupDialogProps = {
  groupId: number;
  initialName: string;
  initialProfilePicture: string | null;
};

export function ManageGroupDialog({
  groupId,
  initialName,
  initialProfilePicture,
}: ManageGroupDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [profilePicture, setProfilePicture] = useState(initialProfilePicture ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const result = await updateOwnedGroupDetails({
      groupId,
      name,
      profilePicture: profilePicture.trim() || "",
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          Manage group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
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
            <Label htmlFor="group-profile-picture">Profile picture URL (optional)</Label>
            <Input
              id="group-profile-picture"
              value={profilePicture}
              onChange={(e) => setProfilePicture(e.target.value)}
              placeholder="https://example.com/group-image.jpg"
              disabled={isSaving || isClosing}
            />
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
