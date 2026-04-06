import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateGroupForm } from "./new/CreateGroupForm";
import { getGroupsUserIsMemberOf, searchGroups } from "@/db/queries/groups";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; city?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  const params = await searchParams;
  const name = typeof params.name === "string" ? params.name : undefined;
  const city = typeof params.city === "string" ? params.city : undefined;

  const [groups, userMemberGroups] = await Promise.all([
    searchGroups({ name, city }),
    getGroupsUserIsMemberOf(userId),
  ]);

  const userMemberGroupIds = new Set(userMemberGroups.map((group) => group.id));
  const hasFilters = Boolean(name?.trim() || city?.trim());
  const sortedMemberGroups = [...userMemberGroups].sort((a, b) => {
    const aIsOwner = a.ownerId === userId;
    const bIsOwner = b.ownerId === userId;
    if (aIsOwner && !bIsOwner) return -1;
    if (!aIsOwner && bIsOwner) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="container mx-auto max-w-screen-2xl flex flex-col items-center px-4 py-8">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Groups</h1>
          <p className="text-muted-foreground text-sm">
            Search for groups, create a new one, and view groups you are already in.
          </p>
        </div>

        <form
          method="get"
          action="/groups"
          className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm"
        >
          <h2 className="text-lg font-medium">Search groups</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="name"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={name}
                placeholder="Group name"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="city"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                defaultValue={city}
                placeholder="City or town"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" className={cn(buttonVariants({ size: "default" }))}>
              Search
            </button>
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline", size: "default" }))}
            >
              Back to dashboard
            </Link>
          </div>
        </form>

        {hasFilters ? (
          <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-lg font-medium">Search results</h2>
            {groups.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-sm">
                No groups match your search. Try different name or city.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {groups.map((group) => (
                  <li key={group.id}>
                    <Link
                      href={`/group/${group.id}`}
                      className="flex flex-col gap-1 rounded-md border border-border/40 bg-background p-3 transition-colors hover:bg-muted/50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{group.name}</span>
                        {group.ownerId === userId ? (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Owner
                          </span>
                        ) : userMemberGroupIds.has(group.id) ? (
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            Member
                          </span>
                        ) : (
                          <span className="rounded-full border border-border/60 bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Not a member
                          </span>
                        )}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {group.city}
                        {group.description ? ` · ${group.description}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        <details className="group rounded-lg border border-border/40 bg-card p-4 text-card-foreground shadow-sm">
          <summary
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full cursor-pointer justify-center list-none [&::-webkit-details-marker]:hidden",
            )}
          >
            Create new group
          </summary>
          <p className="text-muted-foreground mt-4 text-sm">
            New groups require approval which takes up to 3 days. These will be notified by email.
          </p>
          <div className="mt-4">
            <CreateGroupForm />
          </div>
        </details>

        <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="text-lg font-medium">Groups you&apos;re in</h2>
          {sortedMemberGroups.length === 0 ? (
            <p className="text-muted-foreground mt-2 text-sm">
              You are not a member of any groups yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {sortedMemberGroups.map((group) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/40 bg-background p-3"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/group/${group.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {group.name}
                    </Link>
                    <p className="text-muted-foreground text-sm">
                      {group.city}
                      {group.ownerId === userId ? " · You own this group" : ""}
                    </p>
                  </div>
                  <Link
                    href={`/group/${group.id}`}
                    className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                  >
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
