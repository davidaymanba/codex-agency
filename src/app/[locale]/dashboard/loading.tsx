import { Card, Skeleton } from "@/components/dashboard/ui/primitives";

/** Shimmer skeleton shown while a dashboard route streams in. */
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="h-80 p-5 xl:col-span-2">
          <Skeleton className="h-full w-full" />
        </Card>
        <Card className="h-80 p-5">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>
    </div>
  );
}
