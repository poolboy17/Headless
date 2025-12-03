import { PostCardSkeletonGrid } from '@/components/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function CategoryLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="flex gap-2 mb-8 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
          ))}
        </div>
        <PostCardSkeletonGrid count={12} />
      </div>
    </div>
  );
}
