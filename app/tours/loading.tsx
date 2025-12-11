export default function ToursLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero Skeleton */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="h-12 w-96 bg-gray-700 rounded animate-pulse mb-4" />
          <div className="h-6 w-[600px] max-w-full bg-gray-700/50 rounded animate-pulse mb-2" />
          <div className="h-4 w-32 bg-gray-700/30 rounded animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="h-5 w-48 bg-muted rounded animate-pulse mb-8" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 overflow-hidden">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-muted rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted/50 rounded animate-pulse" />
                <div className="flex gap-3">
                  <div className="h-3 w-16 bg-muted/30 rounded animate-pulse" />
                  <div className="h-3 w-12 bg-muted/30 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
