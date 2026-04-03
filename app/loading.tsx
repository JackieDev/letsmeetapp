export default function RootLoading() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-4">
      <div className="h-8 w-44 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      <div className="mt-2 h-10 w-40 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
