import { Skeleton } from '@/components/ui/skeleton';

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 h-full border border-neutral-100 dark:border-neutral-800">
      <Skeleton className="aspect-[16/9] w-full rounded-t-3xl rounded-b-none" />
      <div className="flex flex-1 flex-col space-y-3 px-4 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-auto pt-2">
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PostCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative flex flex-col-reverse justify-end md:flex-row py-8 md:py-12 container mx-auto px-4">
      <div className="z-10 -mt-24 w-full px-4 md:absolute md:start-8 md:top-1/2 md:mt-0 md:w-3/5 md:-translate-y-1/2 md:px-0 lg:w-1/2 xl:w-2/5">
        <div className="space-y-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-xl sm:space-y-5 sm:p-8 md:px-10 xl:py-12 border border-white/20 dark:border-neutral-700/50">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
      <div className="w-full md:w-4/5 lg:w-2/3 md:ml-auto">
        <Skeleton className="aspect-[16/12] sm:aspect-[16/9] md:aspect-[16/10] lg:aspect-[16/9] rounded-3xl" />
      </div>
    </section>
  );
}

export function ArticleSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Skeleton className="h-4 w-32 mb-8" />
      <Skeleton className="h-12 w-full mb-4" />
      <Skeleton className="h-12 w-3/4 mb-8" />
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="aspect-[16/9] w-full rounded-2xl mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
