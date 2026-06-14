import Link from "next/link";

export function BillingDashboardLink() {
  return (
    <Link href="/dashboard" className="underline underline-offset-4 hover:opacity-80">
      To dashboard
    </Link>
  );
}
