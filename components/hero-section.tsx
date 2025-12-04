import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WPPost } from '@/lib/wordpress';
import { stripHtml, formatDate, getReadingTime, getCategories_Post, getFeaturedImage } from '@/lib/wordpress';

interface HeroSectionProps {
  post: WPPost;
}

export function HeroSection({ post }: HeroSectionProps) {
  const categories = getCategories_Post(post);
  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt.rendered);
  const readingTime = getReadingTime(post.content.rendered);
  const featuredImage = getFeaturedImage(post, 'large');

  return (
    <section className="relative py-8 md:py-12 container mx-auto px-4">
      <Link href={`/post/${post.slug}`} className="block relative group">
        <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-3xl relative bg-muted">
          {featuredImage ? (
            <Image
              src={featuredImage.url}
              alt={featuredImage.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 100vw"
            />
          ) : (
            <Image
              src="/assets/hero.png"
              alt="CURSED TOURS - Some boundaries aren't meant to be crossed"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-3xl" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            {categories.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4">
                {categories.slice(0, 2).map((cat) => (
                  <Badge
                    key={cat.id}
                    className="bg-white/20 text-white hover:bg-white/30 border-0 text-xs uppercase tracking-wider font-semibold backdrop-blur-sm"
                    data-testid={`hero-badge-category-${cat.id}`}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            )}

            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight mb-3" data-testid="hero-title">
              <span className="line-clamp-2 group-hover:underline decoration-2 underline-offset-4">
                {title}
              </span>
            </h2>

            {excerpt && (
              <p className="text-white/80 text-sm sm:text-base line-clamp-2 leading-relaxed max-w-3xl mb-4">
                {excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-sm text-white/70">
              <span>{formatDate(post.date)}</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readingTime} min read
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
