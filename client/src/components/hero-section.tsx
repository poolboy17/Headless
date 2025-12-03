import { Link } from "wouter";
import { ArrowRight, Calendar, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { EnrichedPost, WPCategory } from "@shared/schema";
import heroImage from "@assets/file_0000000035b461fb871702e91bfb805a_(4)_1764780560382.png";

interface HeroSectionProps {
  post: EnrichedPost;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getReadingTime(content: string): number {
  const text = stripHtml(content);
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function HeroSection({ post }: HeroSectionProps) {
  const author = post._embedded?.author?.[0];
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const terms = post._embedded?.["wp:term"]?.[0];
  const categories = Array.isArray(terms)
    ? terms.filter((t): t is WPCategory => "count" in t)
    : [];

  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered);
  const imageUrl = media?.media_details?.sizes?.large?.source_url || media?.source_url;
  const readingTime = getReadingTime(post.content.rendered);

  return (
    <section className="relative flex flex-col-reverse justify-end md:flex-row py-8 md:py-12 container mx-auto px-4">
      {/* Content Card - Ncmaz glassmorphism style */}
      <div className="z-10 -mt-24 w-full px-4 md:absolute md:start-8 md:top-1/2 md:mt-0 md:w-3/5 md:-translate-y-1/2 md:px-0 lg:w-1/2 xl:w-2/5">
        <div className="space-y-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-xl backdrop-filter sm:space-y-5 sm:p-8 md:px-10 xl:py-12 border border-white/20 dark:border-neutral-700/50">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {categories.slice(0, 2).map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <Badge
                    className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-xs uppercase tracking-wider font-semibold"
                    data-testid={`hero-badge-category-${cat.id}`}
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight" data-testid="hero-title">
            <Link href={`/post/${post.slug}`} className="hover:text-primary transition-colors line-clamp-2">
              {title}
            </Link>
          </h2>

          {/* Author & Date */}
          {author && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-neutral-800">
                <AvatarImage src={author.avatar_urls?.["48"]} alt={author.name} />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {author.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{author.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(post.date)}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readingTime} min read
              </span>
            </div>
            <Link href={`/post/${post.slug}`}>
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80" data-testid="hero-cta">
                Read More
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Image - Custom Hero */}
      <div className="w-full md:w-4/5 lg:w-2/3 md:ml-auto">
        <Link href={`/post/${post.slug}`} className="block relative group">
          <div className="aspect-[16/12] sm:aspect-[16/9] md:aspect-[16/10] lg:aspect-[16/9] overflow-hidden rounded-3xl">
            <img
              src={heroImage}
              alt="Cursed Tours - Paranormal Investigations"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Dark gradient overlay for atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-3xl" />
          </div>
        </Link>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative flex flex-col-reverse justify-end md:flex-row py-8 md:py-12 container mx-auto px-4">
      <div className="z-10 -mt-24 w-full px-4 md:absolute md:start-8 md:top-1/2 md:mt-0 md:w-3/5 md:-translate-y-1/2 md:px-0 lg:w-1/2 xl:w-2/5">
        <div className="space-y-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8 md:px-10 xl:py-12">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <div className="flex items-center gap-3 pt-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-24" />
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
