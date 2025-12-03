import { PostCardSkeletonGrid } from '@/components/loading-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function SearchLoading() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-72 mb-2" />
        <Skeleton className="h-6 w-48 mb-8" />
        <PostCardSkeletonGrid count={6} />
      </div>
    </div>
  );
}
