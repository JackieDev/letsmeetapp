export default function BillingLoading() {
  return (
    <div className="container mx-auto max-w-screen-md px-4 py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-56 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
