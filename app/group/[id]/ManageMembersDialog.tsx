"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  approveGroupMember,
  changeGroupMemberRole,
  removeGroupMember,
  setGroupMemberApprovalRequirement,
  toggleBanGroupMember,
} from "@/actions/groups";

type GroupMember = {
  id: number;
  groupId: number;
  userId: string;
  name: string;
  role: "owner" | "organizer" | "member";
  isBanned: boolean;
  isMemberApproved: boolean;
  joinedAt: string | Date;
};

type ManageMembersDialogProps = {
  groupId: number;
  ownerId: string;
  currentUserId: string;
  members: GroupMember[];
  requiresMemberApproval: boolean;
};

export function ManageMembersDialog({
  groupId,
  ownerId,
  currentUserId,
  members,
  requiresMemberApproval,
}: ManageMembersDialogProps) {
  const router = useRouter();
  const [isSubmittingFor, setIsSubmittingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingSetting, setIsUpdatingSetting] = useState(false);

  async function handleToggleRequiresApproval(nextValue: boolean) {
    setError(null);
    setIsUpdatingSetting(true);
    const result = await setGroupMemberApprovalRequirement({
      groupId,
      requiresMemberApproval: nextValue,
    });
    setIsUpdatingSetting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleApprove(memberUserId: string) {
    setError(null);
    setIsSubmittingFor(memberUserId);
    const result = await approveGroupMember({ groupId, userId: memberUserId });
    setIsSubmittingFor(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleRemove(memberUserId: string) {
    setError(null);
    setIsSubmittingFor(memberUserId);
    const result = await removeGroupMember({ groupId, userId: memberUserId });
    setIsSubmittingFor(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleBan(memberUserId: string) {
    setError(null);
    setIsSubmittingFor(memberUserId);
    const result = await toggleBanGroupMember({ groupId, userId: memberUserId });
    setIsSubmittingFor(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function handleChangeRole(memberUserId: string, currentRole: GroupMember["role"]) {
    setError(null);
    setIsSubmittingFor(memberUserId);
    const nextRole = currentRole === "organizer" ? "member" : "organizer";
    const result = await changeGroupMemberRole({
      groupId,
      userId: memberUserId,
      role: nextRole,
    });
    setIsSubmittingFor(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="default">
          Manage members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Group members</DialogTitle>
        </DialogHeader>
        <div className="mt-4 flex items-start justify-between gap-4 rounded-md border border-border/40 bg-muted/40 px-3 py-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="requiresMemberApproval">
              Require approval to join
            </Label>
            <p className="text-xs text-muted-foreground">
              When enabled, new join requests are pending until the group owner approves them.
            </p>
          </div>
          <Switch
            id="requiresMemberApproval"
            checked={requiresMemberApproval}
            onCheckedChange={handleToggleRequiresApproval}
            disabled={isUpdatingSetting}
          />
        </div>

        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto text-base">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-base">No members yet.</p>
          ) : (
            members.map((member) => {
              const isPending = !member.isBanned && !member.isMemberApproved;
              const joined =
                member.joinedAt instanceof Date
                  ? member.joinedAt.toLocaleString()
                  : new Date(member.joinedAt).toLocaleString();
              const isOwnerRow = member.userId === ownerId;
              const isSelf = member.userId === currentUserId;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/40 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {member.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Role: {member.role} · Joined: {joined}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Status:{" "}
                      {member.isBanned
                        ? "Banned"
                        : member.isMemberApproved
                        ? "Active"
                        : "Pending approval"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isPending ? (
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => handleApprove(member.userId)}
                        disabled={
                          isSubmittingFor === member.userId || isOwnerRow || isSelf
                        }
                      >
                        {isSubmittingFor === member.userId ? "Approving…" : "Approve"}
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => handleRemove(member.userId)}
                      disabled={
                        isSubmittingFor === member.userId || isOwnerRow || isSelf
                      }
                      className="text-destructive hover:text-destructive"
                    >
                      {isSubmittingFor === member.userId
                        ? "Working…"
                        : isPending
                        ? "Reject"
                        : "Remove"}
                    </Button>
                    {isPending ? null : (
                      <>
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => handleChangeRole(member.userId, member.role)}
                          disabled={
                            isSubmittingFor === member.userId || isOwnerRow || isSelf
                          }
                        >
                          {member.role === "organizer"
                            ? "Make member"
                            : "Make organizer"}
                        </Button>
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => handleBan(member.userId)}
                          disabled={
                            isSubmittingFor === member.userId || isOwnerRow || isSelf
                          }
                        >
                          {member.isBanned ? "Banned" : "Ban"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {error && (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

