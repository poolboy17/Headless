'use client';

import Link from 'next/link';
import { SafeImage } from '@/components/safe-image';
import { Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { WPPost, WPCategory } from '@/lib/wordpress';
import { stripHtml, formatDate, getReadingTime, getFeaturedImage, getAuthor, getCategories_Post, getTags_Post } from '@/lib/wordpress';

interface PostCardProps {
  post: WPPost;
  variant?: 'default' | 'featured' | 'compact';
}

export function PostCard({ post, variant = 'default' }: PostCardProps) {
  const author = getAuthor(post);
  const featuredImage = getFeaturedImage(post);
  const categories = getCategories_Post(post);
  const tags = getTags_Post(post);
  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered);
  const readingTime = getReadingTime(post.content.rendered);

  if (variant === 'compact') {
    return (
      <Link href={`/post/${post.slug}`}>
        <div className="group flex gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer">
          {featuredImage && (
            <div className="w-20 h-20 shrink-0 overflow-hidden rounded-xl relative bg-muted">
              <SafeImage
                src={featuredImage.url}
                alt={featuredImage.alt}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="80px"
                loading="lazy"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors"
              data-testid={`text-post-title-${post.id}`}
            >
              {title}
            </h3>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDate(post.date)}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/post/${post.slug}`}>
        <div className="nc-Card11 group relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 h-full cursor-pointer border border-neutral-100 dark:border-neutral-800 hover:shadow-xl transition-shadow duration-300">
          <div className="relative z-10 block w-full flex-shrink-0 overflow-hidden rounded-t-3xl aspect-[4/3] bg-muted">
            {featuredImage && (
              <SafeImage
                src={featuredImage.url}
                alt={featuredImage.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                loading="lazy"
              />
            )}
          </div>

          {categories.length > 0 && (
            <span className="absolute inset-x-3 top-3 z-10 flex gap-2 flex-wrap">
              {categories.slice(0, 2).map((cat) => (
                <Badge
                  key={cat.id}
                  className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm text-[10px] uppercase tracking-wider font-semibold border-0"
                  data-testid={`badge-category-${cat.id}`}
                >
                  {cat.name}
                </Badge>
              ))}
            </span>
          )}

          <div className="flex flex-1 flex-col space-y-3 px-4 py-4 border-t-0">
            {author && (
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={author.avatar_urls?.['24']} alt={author.name} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                    {author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{author.name}</span>
                  <span>·</span>
                  <span>{formatDate(post.date)}</span>
                </div>
              </div>
            )}

            <h3
              className="nc-card-title block text-base font-semibold group-hover:text-primary transition-colors"
              data-testid={`text-post-title-${post.id}`}
            >
              <span className="line-clamp-2" title={title}>{title}</span>
            </h3>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {readingTime} min
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/post/${post.slug}`}>
      <div className="nc-Card11 group relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 h-full cursor-pointer border border-neutral-100 dark:border-neutral-800 hover:shadow-lg transition-shadow duration-300" data-testid={`card-post-${post.slug}`}>
        <div className="relative z-10 block w-full flex-shrink-0 overflow-hidden rounded-t-3xl aspect-[16/9] bg-muted">
          {featuredImage && (
            <SafeImage
              src={featuredImage.url}
              alt={featuredImage.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          )}
        </div>

        {categories.length > 0 && (
          <span className="absolute left-3 top-3 z-10">
            <Badge className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm text-[10px] uppercase tracking-wider font-semibold border-0">
              {categories[0].name}
            </Badge>
          </span>
        )}

        <div className="flex flex-1 flex-col space-y-3 px-4 py-4">
          {author && (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={author.avatar_urls?.['24']} alt={author.name} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                  {author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{author.name}</span>
                <span>·</span>
                <span>{formatDate(post.date)}</span>
              </div>
            </div>
          )}

          <h3
            className="nc-card-title block text-lg font-semibold group-hover:text-primary transition-colors"
            data-testid={`text-post-title-${post.id}`}
          >
            <span className="line-clamp-2" title={title}>{title}</span>
          </h3>

          <p className="text-muted-foreground text-sm line-clamp-2">{excerpt}</p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground font-medium"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-2.5 pt-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {readingTime} min
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
