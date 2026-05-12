import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-secondary" />
          <Skeleton className="h-4 w-64 bg-secondary" />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-secondary" />
                <Skeleton className="h-7 w-28 bg-secondary" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full bg-secondary" />
            </div>
          </div>
        ))}
      </div>

      {/* Banner skeleton */}
      <Skeleton className="h-64 w-full rounded-lg bg-secondary" />

      {/* Chart skeleton */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 bg-secondary" />
            <Skeleton className="h-4 w-48 bg-secondary" />
          </div>
          <Skeleton className="h-9 w-24 bg-secondary" />
        </div>
        <Skeleton className="h-64 w-full bg-secondary" />
      </div>
    </div>
  )
}
