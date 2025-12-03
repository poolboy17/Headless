import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { WPPost, WPCategory } from '@/lib/wordpress';
import { stripHtml, formatDate, getReadingTime, getAuthor, getCategories_Post } from '@/lib/wordpress';

interface HeroSectionProps {
  post: WPPost;
}

export function HeroSection({ post }: HeroSectionProps) {
  const author = getAuthor(post);
  const categories = getCategories_Post(post);
  const title = stripHtml(post.title.rendered);
  const readingTime = getReadingTime(post.content.rendered);

  return (
    <section className="relative flex flex-col-reverse justify-end md:flex-row py-8 md:py-12 container mx-auto px-4">
      <div className="z-10 -mt-24 w-full px-4 md:absolute md:start-8 md:top-1/2 md:mt-0 md:w-3/5 md:-translate-y-1/2 md:px-0 lg:w-1/2 xl:w-2/5">
        <div className="space-y-4 rounded-3xl bg-white/80 dark:bg-neutral-900/80 p-6 shadow-2xl backdrop-blur-xl backdrop-filter sm:space-y-5 sm:p-8 md:px-10 xl:py-12 border border-white/20 dark:border-neutral-700/50">
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

          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight" data-testid="hero-title">
            <Link href={`/post/${post.slug}`} className="hover:text-primary transition-colors line-clamp-2">
              {title}
            </Link>
          </h2>

          {author && (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-neutral-800">
                <AvatarImage src={author.avatar_urls?.['48']} alt={author.name} />
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

      <div className="w-full md:w-4/5 lg:w-2/3 md:ml-auto">
        <Link href={`/post/${post.slug}`} className="block relative group">
          <div className="aspect-[16/12] sm:aspect-[16/9] md:aspect-[16/10] lg:aspect-[16/9] overflow-hidden rounded-3xl relative bg-muted">
            <Image
              src="/assets/hero.png"
              alt="CURSED TOURS - Some boundaries aren't meant to be crossed"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 66vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent rounded-3xl" />
          </div>
        </Link>
      </div>
    </section>
  );
}
