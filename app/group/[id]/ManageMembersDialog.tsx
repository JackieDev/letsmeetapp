"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  changeGroupMemberRole,
  removeGroupMember,
  toggleBanGroupMember,
} from "@/actions/groups";

type GroupMember = {
  id: number;
  groupId: number;
  userId: string;
  name: string;
  role: "owner" | "organizer" | "member";
  isBanned: boolean;
  joinedAt: string | Date;
};

type ManageMembersDialogProps = {
  groupId: number;
  ownerId: string;
  currentUserId: string;
  members: GroupMember[];
};

export function ManageMembersDialog({
  groupId,
  ownerId,
  currentUserId,
  members,
}: ManageMembersDialogProps) {
  const router = useRouter();
  const [isSubmittingFor, setIsSubmittingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        <div className="mt-4 space-y-3 max-h-96 overflow-y-auto text-base">
          {members.length === 0 ? (
            <p className="text-muted-foreground text-base">No members yet.</p>
          ) : (
            members.map((member) => {
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
                      Status: {member.isBanned ? "Banned" : "Active"}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
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
                        ? "Removing…"
                        : "Remove"}
                    </Button>
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

