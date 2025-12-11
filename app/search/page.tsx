import type { Metadata } from 'next';
import { searchPostsForPage, getCategoriesForPage } from '@/lib/posts';
import { CategoryNav } from '@/components/category-nav';
import { AnimatedPostGrid } from '@/components/animated-post-grid';
import { NoSearchResults } from '@/components/empty-state';
import { SITE_URL, SITE_NAME } from '@/lib/seo-config';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `Search: ${q} | ${SITE_NAME}` : `Search | ${SITE_NAME}`;
  const description = q 
    ? `Search results for "${q}" on ${SITE_NAME} - haunted locations, ghost tours, and paranormal investigations.`
    : `Search ${SITE_NAME} for haunted locations, ghost stories, paranormal investigations, and supernatural encounters.`;

  const canonicalUrl = `${SITE_URL}/search${q ? `?q=${encodeURIComponent(q)}` : ''}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  let categories: Awaited<ReturnType<typeof getCategoriesForPage>> = [];
  let postsData: Awaited<ReturnType<typeof searchPostsForPage>> = { posts: [], totalPosts: 0, totalPages: 0 };

  try {
    [categories, postsData] = await Promise.all([
      getCategoriesForPage(),
      q ? searchPostsForPage({ query: q, perPage: 20 }) : Promise.resolve({ posts: [], totalPosts: 0, totalPages: 0 }),
    ]);
  } catch {
    // Fallback if database is unavailable
  }

  const { posts, totalPosts } = postsData;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {q ? `Search results for "${q}"` : 'Search'}
          </h1>
          {q && (
            <p className="text-muted-foreground">
              Found {totalPosts} article{totalPosts !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <CategoryNav categories={categories} className="mb-8" />

        {!q ? (
          <NoSearchResults />
        ) : posts.length === 0 ? (
          <NoSearchResults query={q} />
        ) : (
          <AnimatedPostGrid posts={posts} staggerDelay={80} />
        )}
      </div>
    </div>
  );
}
