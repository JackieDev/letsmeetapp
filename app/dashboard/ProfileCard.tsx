"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Member } from "@/db/queries/members";
import { updateCurrentMemberProfile } from "@/actions/members";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Props = {
  member: Member | null;
};

export function ProfileCard({ member }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    const name = formData.get("name")?.toString() ?? "";
    const profilePicture = formData.get("profilePicture")?.toString() ?? "";
    const city = formData.get("city")?.toString() ?? "";
    const interests = formData.get("interests")?.toString() ?? "";

    startTransition(async () => {
      await updateCurrentMemberProfile({
        name,
        profilePicture,
        city,
        interests,
      });
      setIsEditing(false);
    });
  }

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium">Your profile</h2>
          {member?.name ? (
            <p className="text-foreground mt-1 text-base font-semibold">
              {member.name}
            </p>
          ) : null}
          <p className="text-muted-foreground mt-1 text-base">
            {isEditing
              ? "Add your name, picture, city, and a short description so group organizers know a bit more about you."
              : "Your profile is visible to group organizers and members."}
          </p>
        </div>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit profile
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
          {member?.profilePicture ? (
            <Image
              src={member.profilePicture}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-2xl">
              ?
            </div>
          )}
        </div>
        {!isEditing ? (
          <div className="min-w-0 space-y-1 text-sm">
            {member?.city ? (
              <p>
                <span className="text-muted-foreground">City:</span>{" "}
                <span className="font-medium">{member.city}</span>
              </p>
            ) : null}
            {member?.interests ? (
              <p>
                <span className="text-muted-foreground">Interests:</span>{" "}
                <span className="font-medium">{member.interests}</span>
              </p>
            ) : null}
            {!member?.city && !member?.interests ? (
              <p className="text-muted-foreground">
                No city or interests set. Edit your profile to add them.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <form
          className="mt-4 space-y-4"
          action={handleSubmit}
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="name">
              Name
            </label>
            <Input
              id="name"
              name="name"
              defaultValue={member?.name ?? ""}
              placeholder="How you'd like your name to appear"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="profilePicture">
              Profile picture URL
            </label>
            <Input
              id="profilePicture"
              name="profilePicture"
              type="url"
              defaultValue={member?.profilePicture ?? ""}
              placeholder="https://example.com/your-photo.jpg"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="city">
              City
            </label>
            <Input
              id="city"
              name="city"
              defaultValue={member?.city ?? ""}
              placeholder="e.g. London"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="interests">
              Interests
            </label>
            <textarea
              id="interests"
              name="interests"
              defaultValue={member?.interests ?? ""}
              className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Tell people what you're into – sports, tech, books, etc."
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save profile"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

