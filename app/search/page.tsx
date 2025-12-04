import type { Metadata } from 'next';
import { getPosts, getCategories } from '@/lib/wordpress';
import { CategoryNav } from '@/components/category-nav';
import { AnimatedPostGrid } from '@/components/animated-post-grid';
import { NoSearchResults } from '@/components/empty-state';

export const dynamic = 'force-dynamic';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q}` : 'Search',
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;

  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let postsData: Awaited<ReturnType<typeof getPosts>> = { posts: [], totalPosts: 0, totalPages: 0 };

  try {
    [categories, postsData] = await Promise.all([
      getCategories(),
      q ? getPosts({ search: q, perPage: 20 }) : Promise.resolve({ posts: [], totalPosts: 0, totalPages: 0 }),
    ]);
  } catch {
    // Fallback if WordPress API is unavailable
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
