"use client";

import Image from "next/image";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type GroupMemberProfile = {
  userId: string;
  name: string;
  profilePicture: string | null;
  role: "owner" | "organizer" | "member";
};

type ViewGroupMembersDialogProps = {
  members: GroupMemberProfile[];
};

export function ViewGroupMembersDialog({ members }: ViewGroupMembersDialogProps) {
  const sortedMembers = useMemo(() => {
    // Owners/organizers first, then alphabetical by display name.
    const rank: Record<GroupMemberProfile["role"], number> = {
      owner: 0,
      organizer: 1,
      member: 2,
    };
    return [...members].sort((a, b) => {
      const r = rank[a.role] - rank[b.role];
      if (r !== 0) return r;
      return a.name.localeCompare(b.name);
    });
  }, [members]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Group members</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {sortedMembers.length === 0 ? (
            <p className="text-muted-foreground text-sm">No members yet.</p>
          ) : (
            sortedMembers.map((m) => (
              <div
                key={m.userId}
                className="flex items-center gap-3 rounded-md border border-border/40 bg-muted/30 px-3 py-2"
              >
                {m.profilePicture ? (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted shrink-0">
                    <Image
                      src={m.profilePicture}
                      alt={m.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    —
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.role}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

