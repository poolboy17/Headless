import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { SiX, SiFacebook, SiLinkedin } from 'react-icons/si';
import { getPost } from '@/lib/wordpress';
import { stripHtml, formatDate, getReadingTime, getFeaturedImage, getAuthor, getCategories_Post, getTags_Post } from '@/lib/wordpress';
import { PostCard } from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const { post } = await getPost(slug);
    const title = stripHtml(post.title.rendered);
    const description = stripHtml(post.excerpt.rendered).slice(0, 160);
    const featuredImage = getFeaturedImage(post, 'large');

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        images: featuredImage ? [featuredImage.url] : [],
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

  const shareUrl = `https://cursedtours.com/post/${post.slug}`;
  const shareText = encodeURIComponent(title);

  return (
    <article className="min-h-screen">
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
            <div className="aspect-[16/9] relative overflow-hidden rounded-3xl">
              <Image
                src={featuredImage.url}
                alt={featuredImage.alt}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <div
            className="wp-content"
            dangerouslySetInnerHTML={{ __html: post.content.rendered }}
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
                    <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: author.description }} />
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
