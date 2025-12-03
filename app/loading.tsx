import { HeroSkeleton, PostCardSkeletonGrid } from '@/components/loading-skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen">
      <HeroSkeleton />
      <div className="container mx-auto px-4 py-12">
        <PostCardSkeletonGrid count={9} />
      </div>
    </div>
  );
}
