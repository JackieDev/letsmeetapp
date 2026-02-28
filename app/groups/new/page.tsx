import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateGroupForm } from "./CreateGroupForm";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function NewGroupPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  return (
    <div className="container max-w-screen-2xl flex flex-col items-center px-4 py-8">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Create Group</h1>
          <p className="text-muted-foreground text-sm">
            Add a new group. It will need approval before others can find it.
          </p>
        </div>

        <CreateGroupForm />

        <div className="flex gap-2">
          <Link
            href="/groups/search"
            className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          >
            Back to search
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "default" }))}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
