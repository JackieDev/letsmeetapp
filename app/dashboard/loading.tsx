export default function DashboardLoading() {
  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-2">
          <div className="h-9 w-44 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-72 w-full animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}
