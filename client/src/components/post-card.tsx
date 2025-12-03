import { Link } from "wouter";
import { Calendar, Clock, MessageCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { EnrichedPost, WPCategory } from "@shared/schema";

interface PostCardProps {
  post: EnrichedPost;
  variant?: "default" | "featured" | "compact";
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getReadingTime(content: string): number {
  const text = stripHtml(content);
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function getAuthor(post: EnrichedPost) {
  return post._embedded?.author?.[0];
}

function getFeaturedImage(post: EnrichedPost) {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (media) {
    return {
      url: media.media_details?.sizes?.medium_large?.source_url || media.source_url,
      alt: media.alt_text || stripHtml(post.title.rendered),
    };
  }
  return null;
}

function getCategories(post: EnrichedPost): WPCategory[] {
  const terms = post._embedded?.["wp:term"]?.[0];
  if (Array.isArray(terms)) {
    return terms.filter((t): t is WPCategory => "count" in t);
  }
  return [];
}

export function PostCard({ post, variant = "default" }: PostCardProps) {
  const author = getAuthor(post);
  const featuredImage = getFeaturedImage(post);
  const categories = getCategories(post);
  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered);
  const readingTime = getReadingTime(post.content.rendered);

  if (variant === "compact") {
    return (
      <Link href={`/post/${post.slug}`}>
        <div className="group flex gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer">
          {featuredImage && (
            <div className="w-20 h-20 shrink-0 overflow-hidden rounded-xl">
              <img
                src={featuredImage.url}
                alt={featuredImage.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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

  if (variant === "featured") {
    return (
      <Link href={`/post/${post.slug}`}>
        <div className="nc-Card11 group relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 h-full cursor-pointer border border-neutral-100 dark:border-neutral-800 hover:shadow-xl transition-shadow duration-300">
          {/* Image */}
          <div className="relative z-10 block w-full flex-shrink-0 overflow-hidden rounded-t-3xl aspect-[4/3]">
            {featuredImage ? (
              <img
                src={featuredImage.url}
                alt={featuredImage.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Category badges */}
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

          {/* Content */}
          <div className="flex flex-1 flex-col space-y-3 px-4 py-4 border-t-0">
            {/* Author & Date */}
            {author && (
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={author.avatar_urls?.["24"]} alt={author.name} />
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

            {/* Title */}
            <h3
              className="nc-card-title block text-base font-semibold group-hover:text-primary transition-colors"
              data-testid={`text-post-title-${post.id}`}
            >
              <span className="line-clamp-2" title={title}>{title}</span>
            </h3>

            {/* Footer */}
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

  // Default variant - similar to Card11 from Ncmaz
  return (
    <Link href={`/post/${post.slug}`}>
      <div className="nc-Card11 group relative flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 h-full cursor-pointer border border-neutral-100 dark:border-neutral-800 hover:shadow-lg transition-shadow duration-300">
        {/* Image */}
        <div className="relative z-10 block w-full flex-shrink-0 overflow-hidden rounded-t-3xl aspect-[16/9]">
          {featuredImage ? (
            <img
              src={featuredImage.url}
              alt={featuredImage.alt}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <span className="text-muted-foreground text-sm">No image</span>
            </div>
          )}
        </div>

        {/* Category badge */}
        {categories.length > 0 && (
          <span className="absolute left-3 top-3 z-10">
            <Badge
              className="bg-white/90 dark:bg-neutral-900/90 text-foreground backdrop-blur-sm text-[10px] uppercase tracking-wider font-semibold border-0"
            >
              {categories[0].name}
            </Badge>
          </span>
        )}

        {/* Content */}
        <div className="flex flex-1 flex-col space-y-3 px-4 py-4">
          {/* Author & Date */}
          {author && (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={author.avatar_urls?.["24"]} alt={author.name} />
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

          {/* Title */}
          <h3
            className="nc-card-title block text-lg font-semibold group-hover:text-primary transition-colors"
            data-testid={`text-post-title-${post.id}`}
          >
            <span className="line-clamp-2" title={title}>{title}</span>
          </h3>

          {/* Excerpt */}
          <p className="text-muted-foreground text-sm line-clamp-2">{excerpt}</p>

          {/* Footer */}
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

export function PostCardSkeleton({ variant = "default" }: { variant?: "default" | "featured" | "compact" }) {
  if (variant === "compact") {
    return (
      <div className="flex gap-4 p-3">
        <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
      <Skeleton className="aspect-[16/9]" />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}
