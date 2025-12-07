'use client';

import Link from 'next/link';
import { SafeImage } from '@/components/safe-image';
import { TrendingUp, Flame } from 'lucide-react';
import type { WPPost } from '@/lib/wordpress';
import { stripHtml, getFeaturedImage } from '@/lib/wordpress';
import { ScrollReveal } from '@/components/scroll-reveal';

interface TrendingPostsProps {
  posts: WPPost[];
  className?: string;
}

export function TrendingPosts({ posts, className }: TrendingPostsProps) {
  if (posts.length === 0) return null;

  return (
    <ScrollReveal className={className}>
      <section className="py-8 md:py-12">
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
            <TrendingCard key={post.id} post={post} rank={index + 1} />
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}

interface TrendingCardProps {
  post: WPPost;
  rank: number;
}

function TrendingCard({ post, rank }: TrendingCardProps) {
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
            <SafeImage
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

// Alternative horizontal scrolling version
export function TrendingPostsHorizontal({ posts, className }: TrendingPostsProps) {
  if (posts.length === 0) return null;

  return (
    <ScrollReveal className={className}>
      <section className="py-8 md:py-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold">Trending Now</h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {posts.slice(0, 6).map((post, index) => (
            <TrendingCardHorizontal key={post.id} post={post} rank={index + 1} />
          ))}
        </div>
      </section>
    </ScrollReveal>
  );
}

function TrendingCardHorizontal({ post, rank }: TrendingCardProps) {
  const title = stripHtml(post.title.rendered);
  const featuredImage = getFeaturedImage(post);

  return (
    <Link href={`/post/${post.slug}`} className="shrink-0 w-72">
      <div className="group relative overflow-hidden rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
        {/* Image */}
        <div className="aspect-[16/10] relative bg-muted">
          {featuredImage ? (
            <SafeImage
              src={featuredImage.url}
              alt={featuredImage.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="288px"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-red-500/20" />
          )}
          {/* Rank badge */}
          <div className="absolute top-3 left-3 flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold text-sm shadow-lg">
            {rank}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
