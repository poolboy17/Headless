import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { SiX, SiFacebook, SiLinkedin } from 'react-icons/si';
import { getPost, buildSeo, getAllPostSlugs, ViatorTour } from '@/lib/wordpress';
import { stripHtml, formatDate, getReadingTime, getFeaturedImage, getAuthor, getCategories_Post, getTags_Post } from '@/lib/wordpress';
import { sanitizeContent } from '@/lib/sanitize-content';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EnhancedPostSchema } from '@/components/Schema';

/**
 * Injects Viator CTA after the first <h2> heading in the content.
 * This placement catches ~70-80% of readers before attention drops off.
 */
function injectViatorCTA(content: string, tour: ViatorTour | undefined): string {
  if (!tour || !tour.url) return content;
  
  // Find the first </h2> closing tag
  const h2Match = content.match(/<\/h2>/i);
  if (!h2Match || h2Match.index === undefined) {
    // No h2 found, return content unchanged (CTA won't show)
    return content;
  }
  
  const insertPosition = h2Match.index + h2Match[0].length;
  
  // Create CTA HTML that will be hydrated client-side
  const ctaHtml = `
    <div class="viator-cta-wrapper my-8" data-viator-tour='${JSON.stringify(tour).replace(/'/g, "&#39;")}'>
      <div class="bg-gradient-to-br from-purple-900/20 to-slate-900/40 border border-purple-500/30 rounded-lg p-6">
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">🔮 Experience It Yourself</p>
            <h3 class="font-bold text-lg text-white mb-2">${tour.title}</h3>
            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-300 mb-4">
              ${tour.destination ? `<span class="flex items-center gap-1"><svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>${tour.destination}</span>` : ''}
              ${tour.rating ? `<span class="flex items-center gap-1"><svg class="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>${tour.rating.toFixed(1)}${tour.reviewCount ? ` <span class="text-gray-400">(${tour.reviewCount.toLocaleString()})</span>` : ''}</span>` : ''}
              ${tour.price ? `<span class="font-semibold text-green-400">From ${tour.price}</span>` : ''}
            </div>
            <a href="${tour.url}" target="_blank" rel="noopener noreferrer sponsored" class="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-full transition-all hover:scale-105">
              Book This Tour
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          </div>
        </div>
        <p class="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-700/50">Affiliate link – we may earn a commission at no extra cost to you.</p>
      </div>
    </div>
  `;
  
  return content.slice(0, insertPosition) + ctaHtml + content.slice(insertPosition);
}

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getAllPostSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // Return empty array to allow dynamic generation at request time
    return [];
  }
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const { post } = await getPost(slug);
    const seo = buildSeo(post);

    return {
      title: seo.title,
      description: seo.description,
      alternates: {
        canonical: seo.canonical,
      },
      openGraph: {
        title: seo.ogTitle,
        description: seo.ogDescription,
        type: 'article',
        url: seo.canonical,
        images: [{
          url: seo.ogImage,
          alt: seo.altText,
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: seo.ogTitle,
        description: seo.ogDescription,
        images: [seo.ogImage],
      },
    };
  } catch {
    return { title: 'Post Not Found' };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  
  let data;
  try {
    data = await getPost(slug);
  } catch {
    notFound();
  }

  const { post, relatedPosts } = data;
  const author = getAuthor(post);
  const categories = getCategories_Post(post);
  const tags = getTags_Post(post);
  const featuredImage = getFeaturedImage(post, 'large');
  const title = stripHtml(post.title.rendered);
  const readingTime = getReadingTime(post.content.rendered);

  const shareUrl = `https://www.cursedtours.com/post/${post.slug}`;
  const shareText = encodeURIComponent(title);

  return (
    <article className="min-h-screen">
      <EnhancedPostSchema post={post} />
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6 -ml-2" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to articles
          </Button>
        </Link>

        <header className="max-w-4xl mx-auto mb-8">
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <Badge
                    className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-xs uppercase tracking-wider font-semibold"
                    data-testid={`badge-category-${cat.id}`}
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight" data-testid="post-title">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            {author && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={author.avatar_urls?.['48']} alt={author.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{author.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(post.date)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {readingTime} min read
              </span>
            </div>
          </div>
        </header>

        {featuredImage && (
          <div className="max-w-5xl mx-auto mb-12">
            <div className="aspect-[16/9] relative overflow-hidden rounded-3xl bg-muted">
              <Image
                src={featuredImage.url}
                alt={featuredImage.alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                data-testid="post-featured-image"
              />
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <div
            className="wp-content"
            dangerouslySetInnerHTML={{ 
              __html: sanitizeContent(
                injectViatorCTA(post.content.rendered, post.meta?.viator_tour)
              ) 
            }}
          />

          {tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-sm"
                    data-testid={`badge-tag-${tag.id}`}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-8 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Share this article</h3>
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                data-testid="share-twitter"
              >
                <SiX className="h-5 w-5" />
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                data-testid="share-facebook"
              >
                <SiFacebook className="h-5 w-5" />
              </a>
              <a
                href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                data-testid="share-linkedin"
              >
                <SiLinkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {author && (
            <div className="mt-12 p-6 rounded-3xl bg-muted/50">
              <div className="flex gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={author.avatar_urls?.['96']} alt={author.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xl">
                    {author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{author.name}</h3>
                  {author.description && (
                    <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeContent(author.description) }} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {relatedPosts.length > 0 && (
          <section className="mt-16 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedPosts.map((relatedPost) => (
                <PostCard key={relatedPost.id} post={relatedPost} variant="featured" />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
