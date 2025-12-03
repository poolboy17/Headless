import type { Metadata } from 'next';
import { getPosts, getCategories } from '@/lib/wordpress';
import { PostCard } from '@/components/post-card';
import { CategoryNav } from '@/components/category-nav';

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
  const [categories, postsData] = await Promise.all([
    getCategories(),
    q ? getPosts({ search: q, perPage: 20 }) : Promise.resolve({ posts: [], totalPosts: 0, totalPages: 0 }),
  ]);

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
          <div className="text-center py-12">
            <p className="text-muted-foreground">Enter a search term to find articles.</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found for &quot;{q}&quot;.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
