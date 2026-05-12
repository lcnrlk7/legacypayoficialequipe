import { Skeleton } from "@/components/ui/skeleton"

export default function CEOLoading() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-secondary" />
        <Skeleton className="h-4 w-64 bg-secondary" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-28 bg-secondary" />
                <Skeleton className="h-4 w-24 bg-secondary" />
                <Skeleton className="h-3 w-32 bg-secondary" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full bg-secondary" />
            </div>
          </div>
        ))}
      </div>

      {/* Pending cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full bg-secondary" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-12 bg-secondary" />
                <Skeleton className="h-4 w-28 bg-secondary" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-5 border-b border-border">
          <Skeleton className="h-5 w-40 bg-secondary" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg bg-secondary" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 bg-secondary" />
                  <Skeleton className="h-3 w-40 bg-secondary" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-20 bg-secondary ml-auto" />
                <Skeleton className="h-3 w-16 bg-secondary ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
