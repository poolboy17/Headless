import { redirect } from 'next/navigation';
import { getPostsForPage, getCategoriesForPage } from '@/lib/posts';
import { HeroSection } from '@/components/hero-section';
import { CategoryNav } from '@/components/category-nav';
import { Pagination } from '@/components/pagination';
import { NewsletterCTA } from '@/components/newsletter-cta';
import { ServerPostGrid } from '@/components/server-post-grid';
import { ServerTrendingPosts } from '@/components/server-trending-posts';
import { NoPostsFound } from '@/components/empty-state';
import { ExperiencePicker } from '@/components/experience-picker';
import { HomePageSchema } from '@/components/Schema';

// Use ISR with 5-minute revalidation for optimal caching
export const revalidate = 300;

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page } = await searchParams;
  const requestedPage = Math.max(1, parseInt(page || '1', 10));
  const postsPerPage = 10;

  let postsData: Awaited<ReturnType<typeof getPostsForPage>> = { posts: [], totalPosts: 0, totalPages: 0 };
  let categories: Awaited<ReturnType<typeof getCategoriesForPage>> = [];

  try {
    [postsData, categories] = await Promise.all([
      getPostsForPage({ perPage: postsPerPage, page: requestedPage }),
      getCategoriesForPage(),
    ]);
  } catch {
    // Return empty data if database is unavailable
  }

  const { posts, totalPosts, totalPages } = postsData;
  
  const currentPage = Math.min(requestedPage, Math.max(1, totalPages));
  if (requestedPage > totalPages && totalPages > 0) {
    redirect(totalPages === 1 ? '/' : `/?page=${totalPages}`);
  }
  const featuredPost = currentPage === 1 ? posts[0] : null;
  const gridPosts = currentPage === 1 ? posts.slice(1) : posts;
  // Use posts 2-5 as "trending" on first page
  const trendingPosts = currentPage === 1 ? posts.slice(1, 5) : [];

  return (
    <div className="min-h-screen">
      {currentPage === 1 && posts.length > 0 && (
        <HomePageSchema featuredPosts={posts.slice(0, 5)} />
      )}
      {featuredPost && <HeroSection post={featuredPost} />}

      {/* Experience Picker - only show on first page */}
      {currentPage === 1 && (
        <div className="container mx-auto px-4">
          <ExperiencePicker />
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {/* Trending section - server rendered */}
        {currentPage === 1 && trendingPosts.length >= 4 && (
          <ServerTrendingPosts posts={trendingPosts} className="mb-8" />
        )}

        <CategoryNav categories={categories} className="mb-8" />

        <div className="flex items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold">
            {currentPage === 1 ? 'Latest Articles' : `Articles - Page ${currentPage}`}
          </h2>
          <span className="text-sm text-muted-foreground">{totalPosts} articles</span>
        </div>

        {/* Posts grid - server rendered for instant display */}
        {gridPosts.length > 0 ? (
          <>
            <ServerPostGrid posts={gridPosts.slice(0, 6)} />

            {/* Newsletter CTA */}
            {currentPage === 1 && gridPosts.length >= 6 && <NewsletterCTA />}

            {/* Remaining posts */}
            {gridPosts.length > 6 && (
              <ServerPostGrid posts={gridPosts.slice(6)} className="mt-6" />
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/" />
          </>
        ) : (
          <NoPostsFound />
        )}
      </div>
    </div>
  );
}
