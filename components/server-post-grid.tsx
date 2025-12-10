import { ServerPostCard } from '@/components/server-post-card';
import type { WPPost } from '@/lib/wordpress';
import { cn } from '@/lib/utils';

interface ServerPostGridProps {
  posts: WPPost[];
  className?: string;
}

/**
 * Server-rendered post grid.
 * Content is included in initial HTML - no hydration delay.
 */
export function ServerPostGrid({ posts, className }: ServerPostGridProps) {
  return (
    <div className={cn('grid gap-6 md:grid-cols-2 lg:grid-cols-3', className)}>
      {posts.map((post) => (
        <ServerPostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
