export default function DestinationLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero Skeleton */}
      <div className="relative h-[400px] md:h-[500px] bg-muted animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
          <div className="container mx-auto">
            <div className="h-6 w-24 bg-white/20 rounded mb-4" />
            <div className="h-12 w-80 bg-white/20 rounded mb-3" />
            <div className="h-6 w-60 bg-white/20 rounded mb-2" />
            <div className="h-5 w-40 bg-white/20 rounded" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Description Skeleton */}
        <div className="max-w-3xl mb-12 space-y-4">
          <div className="h-6 w-full bg-muted rounded animate-pulse" />
          <div className="h-6 w-5/6 bg-muted rounded animate-pulse" />
          <div className="h-6 w-4/5 bg-muted rounded animate-pulse" />
        </div>

        {/* Tours Section Skeleton */}
        <div className="mt-12">
          <div className="h-8 w-48 bg-muted rounded mb-6 animate-pulse" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 overflow-hidden">
                <div className="aspect-[4/3] bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-5 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
