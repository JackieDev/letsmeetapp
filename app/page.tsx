import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { HomeAuthButtons } from "@/components/HomeAuthButtons";
import { parseInternalRedirectPath } from "@/lib/app-url";
import { tryActivateMemberFromClerkSubscription } from "@/lib/activate-member-from-clerk";
import { getMemberAccessStatus } from "@/lib/member-access";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectTarget = parseInternalRedirectPath(params.redirect_url);

  const { userId } = await auth();
  if (userId) {
    if (redirectTarget) {
      redirect(redirectTarget);
    }

    let access = await getMemberAccessStatus(userId);

    if (!access.hasAccess) {
      const synced = await tryActivateMemberFromClerkSubscription(userId);
      if (synced) {
        access = await getMemberAccessStatus(userId);
      }
    }

    redirect(access.hasAccess ? "/dashboard" : "/billing");
  }

  if (redirectTarget) {
    redirect(redirectTarget);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-[1.345rem] px-4">
      <div className="flex flex-col items-center gap-[0.504rem] text-center">
        <h1 className="-mx-[0.15rem] -my-[0.1125rem] flex flex-wrap items-baseline justify-center gap-[0.425rem] text-[2.576rem] font-semibold tracking-tight sm:text-[3.435rem]">
          LetsMeet.uk
        </h1>
        <p className="text-[1.3365rem] text-muted-foreground">
          Your new community platform
        </p>
        <p className="text-[1.2375rem] text-[#39ff14]">
          Free for the first 6 months!
        </p>
      </div>
      <HomeAuthButtons />
      <p className="text-base text-muted-foreground">
        Create and Join as many Groups as you like.
      </p>
    </div>
  );
}
