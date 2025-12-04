import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800',
        className
      )}
    />
  );
}

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
      {/* Image */}
      <Skeleton className="aspect-[16/9] rounded-none" />

      {/* Content */}
      <div className="flex flex-1 flex-col space-y-3 p-4">
        {/* Author */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>

        {/* Tags */}
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>

        {/* Reading time */}
        <div className="mt-auto pt-2">
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="space-y-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8 md:px-10 xl:py-12 border border-white/20 dark:border-neutral-700/50">
          {/* Category badge */}
          <Skeleton className="h-6 w-24 rounded-full" />

          {/* Title */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>

          {/* Excerpt */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Author */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>

      <div className="w-full md:w-4/5 lg:w-2/3 md:ml-auto">
        <Skeleton className="aspect-[16/12] sm:aspect-[16/9] md:aspect-[16/10] lg:aspect-[16/9] rounded-3xl" />
      </div>
    </section>
  );
}

export function CategoryNavSkeleton() {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />
      ))}
    </div>
  );
}

export function TrendingPostsSkeleton() {
  return (
    <section className="py-8 md:py-12">
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-2xl bg-muted/50">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}
