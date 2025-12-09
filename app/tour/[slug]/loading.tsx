export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      {/* Breadcrumbs skeleton */}
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6" />

      {/* Featured image skeleton */}
      <div className="w-full h-[400px] bg-gray-200 rounded-xl mb-8" />

      {/* Title skeleton */}
      <div className="h-10 bg-gray-200 rounded w-3/4 mb-4" />

      {/* Meta skeleton */}
      <div className="flex gap-4 mb-8">
        <div className="h-5 bg-gray-200 rounded w-24" />
        <div className="h-5 bg-gray-200 rounded w-20" />
        <div className="h-5 bg-gray-200 rounded w-28" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  );
}
