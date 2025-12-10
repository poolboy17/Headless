import Link from 'next/link';
import { ServerImage } from '@/components/server-image';
import { ServerAvatar } from '@/components/server-avatar';
import { Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WPPost } from '@/lib/wordpress';
import { stripHtml, formatDate, getReadingTime, getFeaturedImage, getAuthor, getCategories_Post, getTags_Post } from '@/lib/wordpress';

interface ServerPostCardProps {
  post: WPPost;
  variant?: 'default' | 'featured' | 'compact';
}

/**
 * Server-rendered post card for SSR/SSG pages.
 * Content is rendered on the server and included in initial HTML.
 */
export function ServerPostCard({ post, variant = 'default' }: ServerPostCardProps) {
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
              <ServerImage
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
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
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
              <ServerImage
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
                <Badge key={cat.id} className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm text-[10px] uppercase tracking-wider font-semibold border-0">
                  {cat.name}
                </Badge>
              ))}
            </span>
          )}

          <div className="flex flex-1 flex-col space-y-3 px-4 py-4 border-t-0">
            {author && (
              <div className="flex items-center gap-2">
                <ServerAvatar 
                  src={author.avatar_urls?.['24']} 
                  alt={author.name} 
                  fallback={author.name.charAt(0)}
                  className="h-7 w-7"
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{author.name}</span>
                  <span>·</span>
                  <span>{formatDate(post.date)}</span>
                </div>
              </div>
            )}

            <h3 className="nc-card-title block text-base font-semibold group-hover:text-primary transition-colors">
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


  // Default variant
  return (
    <Link href={`/post/${post.slug}`}>
      <div className="nc-Card11 group relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 h-full cursor-pointer border border-neutral-100 dark:border-neutral-800 hover:shadow-xl transition-shadow duration-300">
        <div className="relative z-10 block w-full flex-shrink-0 overflow-hidden rounded-t-3xl aspect-[4/3] bg-muted">
          {featuredImage && (
            <ServerImage
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
          <span className="absolute inset-x-3 top-3 z-10 flex gap-2 flex-wrap">
            {categories.slice(0, 2).map((cat) => (
              <Badge key={cat.id} className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm text-[10px] uppercase tracking-wider font-semibold border-0">
                {cat.name}
              </Badge>
            ))}
          </span>
        )}

        <div className="flex flex-1 flex-col space-y-3 px-4 py-4 border-t-0">
          {author && (
            <div className="flex items-center gap-2">
              <ServerAvatar 
                src={author.avatar_urls?.['24']} 
                alt={author.name} 
                fallback={author.name.charAt(0)}
                className="h-7 w-7"
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{author.name}</span>
                <span>·</span>
                <span>{formatDate(post.date)}</span>
              </div>
            </div>
          )}

          <h3 className="nc-card-title block text-base font-semibold group-hover:text-primary transition-colors">
            <span className="line-clamp-2" title={title}>{title}</span>
          </h3>

          {excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2">{excerpt}</p>
          )}

          <div className="mt-auto flex flex-wrap items-end justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {readingTime} min
              </span>
            </div>
            {tags.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3 w-3" />
                <span className="line-clamp-1">{tags[0].name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
