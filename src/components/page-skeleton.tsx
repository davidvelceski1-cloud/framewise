import { Skeleton } from "./ui";

/** Shimmer placeholder for detail pages while their params stream in. */
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-16" aria-busy="true" aria-label="Loading">
      <div className="grid gap-10 md:grid-cols-[300px_1fr] md:items-end">
        <Skeleton className="aspect-[3/4] w-full max-w-[300px] rounded-[18px]" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <div className="flex gap-2 pt-2"><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-16 rounded-full" /><Skeleton className="h-6 w-16 rounded-full" /></div>
        </div>
      </div>
      <Skeleton className="mt-14 h-11 w-full rounded-full" />
      <div className="mt-10 grid gap-6 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
    </div>
  );
}
