import Link from 'next/link';
import { ServerImage } from '@/components/server-image';
import { TrendingUp, Flame } from 'lucide-react';
import type { WPPost } from '@/lib/wordpress';
import { stripHtml, getFeaturedImage } from '@/lib/wordpress';
import { cn } from '@/lib/utils';

interface ServerTrendingPostsProps {
  posts: WPPost[];
  className?: string;
}

/**
 * Server-rendered trending posts section.
 * Content is included in initial HTML - no hydration delay.
 */
export function ServerTrendingPosts({ posts, className }: ServerTrendingPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className={cn("py-8 md:py-12", className)}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Trending Now</h2>
          <p className="text-sm text-muted-foreground">Most popular articles this week</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {posts.slice(0, 4).map((post, index) => (
          <ServerTrendingCard key={post.id} post={post} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}

interface ServerTrendingCardProps {
  post: WPPost;
  rank: number;
}

function ServerTrendingCard({ post, rank }: ServerTrendingCardProps) {
  const title = stripHtml(post.title.rendered);
  const featuredImage = getFeaturedImage(post);

  return (
    <Link href={`/post/${post.slug}`}>
      <div className="group relative flex gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
        {/* Rank number */}
        <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold text-sm">
          {rank}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-orange-500" />
            <span>Trending</span>
          </div>
        </div>

        {/* Thumbnail */}
        {featuredImage && (
          <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden relative bg-muted">
            <ServerImage
              src={featuredImage.url}
              alt={featuredImage.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="64px"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </Link>
  );
}
