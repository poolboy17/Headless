import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Calendar, Clock, Tag, Share2 } from "lucide-react";
import { SiX, SiFacebook, SiLinkedin } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import type { SinglePostResponse, WPCategory, WPTag } from "@shared/schema";

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

export default function SinglePost() {
  const [, params] = useRoute("/post/:slug");
  const slug = params?.slug;

  const { data, isLoading, error } = useQuery<SinglePostResponse>({
    queryKey: ["/api/posts", slug],
    enabled: !!slug,
  });

  const post = data?.post;
  const relatedPosts = data?.relatedPosts || [];

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Post not found</h2>
        <p className="text-muted-foreground mb-6">
          The post you're looking for doesn't exist or has been removed.
        </p>
        <Link href="/">
          <Button data-testid="button-back-home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <SinglePostSkeleton />;
  }

  if (!post) {
    return null;
  }

  const author = post._embedded?.author?.[0];
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const terms = post._embedded?.["wp:term"];
  const categories: WPCategory[] = terms?.[0]?.filter((t: any): t is WPCategory => "count" in t) || [];
  const tags: WPTag[] = terms?.[1] || [];

  const title = stripHtml(post.title.rendered);
  const imageUrl = media?.media_details?.sizes?.large?.source_url || media?.source_url;
  const readingTime = getReadingTime(post.content.rendered);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(title);

  return (
    <article className="bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to articles
            </Button>
          </Link>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/category/${cat.slug}`}>
                  <Badge 
                    className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-xs uppercase tracking-wider font-semibold"
                    data-testid={`post-category-${cat.id}`}
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight max-w-4xl"
            data-testid="post-title"
          >
            {title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 pb-8">
            {author && (
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarImage src={author.avatar_urls?.["48"]} alt={author.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{author.name}</p>
                  <p className="text-sm text-muted-foreground">Author</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
        </div>

        {/* Featured Image */}
        {imageUrl && (
          <div className="relative aspect-[21/9] max-h-[60vh] overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="max-w-3xl mx-auto">
          {/* Article Content */}
          <div
            className="wp-content"
            dangerouslySetInnerHTML={{ __html: post.content.rendered }}
            data-testid="post-content"
          />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mt-10 pt-8 border-t border-border">
              <div className="flex items-center gap-3 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {tags.map((tag) => (
                  <Link key={tag.id} href={`/tag/${tag.slug}`}>
                    <Badge variant="outline" className="rounded-full" data-testid={`post-tag-${tag.id}`}>
                      {tag.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Share */}
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Share:
              </span>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  asChild
                  data-testid="share-twitter"
                >
                  <a
                    href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SiX className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  asChild
                  data-testid="share-facebook"
                >
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SiFacebook className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  asChild
                  data-testid="share-linkedin"
                >
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${shareText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SiLinkedin className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Author Bio */}
          {author && author.description && (
            <div className="mt-10 p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                  <AvatarImage src={author.avatar_urls?.["96"]} alt={author.name} />
                  <AvatarFallback className="text-xl bg-primary text-primary-foreground font-semibold">
                    {author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg mb-1">About {author.name}</h3>
                  <p className="text-muted-foreground">{author.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-8" data-testid="section-related">
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {relatedPosts.slice(0, 3).map((relatedPost) => (
                <PostCard key={relatedPost.id} post={relatedPost} variant="featured" />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

function SinglePostSkeleton() {
  return (
    <article className="bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <header className="bg-white dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-6">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-6 w-20 mb-4" />
          <Skeleton className="h-12 w-full max-w-3xl mb-2" />
          <Skeleton className="h-12 w-3/4 max-w-2xl mb-6" />
          <div className="flex items-center gap-6 pb-8">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="aspect-[21/9] max-h-[60vh]" />
      </header>
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-48 w-full my-8" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    </article>
  );
}
