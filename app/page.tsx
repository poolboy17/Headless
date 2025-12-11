import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getPostsForPage, getCategoriesForPage } from '@/lib/posts';
import { StaticHero } from '@/components/static-hero';
import { Pagination } from '@/components/pagination';
import { ServerPostGrid } from '@/components/server-post-grid';
import { ServerTrendingPosts } from '@/components/server-trending-posts';
import { NoPostsFound } from '@/components/empty-state';
import { HomePageSchema } from '@/components/Schema';

// Lazy load client components for code splitting
const ExperiencePicker = dynamic(
  () => import('@/components/experience-picker').then(mod => mod.ExperiencePicker),
  { loading: () => <ExperiencePickerSkeleton /> }
);
const CategoryNav = dynamic(
  () => import('@/components/category-nav').then(mod => mod.CategoryNav)
);
const NewsletterCTA = dynamic(
  () => import('@/components/newsletter-cta').then(mod => mod.NewsletterCTA)
);

// Lightweight skeleton for ExperiencePicker
function ExperiencePickerSkeleton() {
  return (
    <section className="py-12 md:py-16">
      <div className="text-center mb-10">
        <div className="h-6 w-32 bg-muted rounded mx-auto mb-4" />
        <div className="h-10 w-80 bg-muted rounded mx-auto mb-3" />
        <div className="h-5 w-96 bg-muted rounded mx-auto" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center p-4 rounded-xl border-2 border-border bg-card">
            <div className="w-14 h-14 rounded-full bg-muted mb-2" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </section>
  );
}

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
  // All posts go to grid now (static hero doesn't use a post)
  const gridPosts = posts;
  // Use first 4 posts as "trending" on first page
  const trendingPosts = currentPage === 1 ? posts.slice(0, 4) : [];

  return (
    <div className="min-h-screen">
      {currentPage === 1 && posts.length > 0 && (
        <HomePageSchema featuredPosts={posts.slice(0, 5)} />
      )}
      {currentPage === 1 && <StaticHero />}

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
