import { formatTrialEndDate } from "@/lib/free-trial";

type Props = {
  trialEndsAt: string;
};

export function BillingTrialStatus({ trialEndsAt }: Props) {
  const endDate = formatTrialEndDate(new Date(trialEndsAt));

  return (
    <div className="rounded-lg border border-border/40 bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-lg font-medium">Free trial</h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Your free trial is active until <span className="font-medium text-foreground">{endDate}</span>.
        You can subscribe now to keep access after your trial ends.
      </p>
    </div>
  );
}
