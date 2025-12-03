import { redirect } from 'next/navigation';
import { getPosts, getCategories } from '@/lib/wordpress';
import { HeroSection } from '@/components/hero-section';
import { PostCard } from '@/components/post-card';
import { CategoryNav } from '@/components/category-nav';
import { Pagination } from '@/components/pagination';

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { page } = await searchParams;
  const requestedPage = Math.max(1, parseInt(page || '1', 10));
  const postsPerPage = 10;

  const [postsData, categories] = await Promise.all([
    getPosts({ perPage: postsPerPage, page: requestedPage }),
    getCategories(),
  ]);

  const { posts, totalPosts, totalPages } = postsData;
  
  const currentPage = Math.min(requestedPage, Math.max(1, totalPages));
  if (requestedPage > totalPages && totalPages > 0) {
    redirect(totalPages === 1 ? '/' : `/?page=${totalPages}`);
  }
  const featuredPost = currentPage === 1 ? posts[0] : null;
  const gridPosts = currentPage === 1 ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen">
      {featuredPost && <HeroSection post={featuredPost} />}

      <div className="container mx-auto px-4 py-12">
        <CategoryNav categories={categories} className="mb-8" />

        <div className="flex items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold">
            {currentPage === 1 ? 'Latest Articles' : `Articles - Page ${currentPage}`}
          </h2>
          <span className="text-sm text-muted-foreground">{totalPosts} articles</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gridPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/" />
      </div>
    </div>
  );
}
