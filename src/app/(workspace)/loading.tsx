import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-8 w-72 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="rounded-lg border bg-card p-4">
          <Skeleton className="h-5 w-44" />
          <div className="mt-5 space-y-4">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-20 w-full" />
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-5 h-44 w-full" />
        </div>
      </div>
    </div>
  );
}
