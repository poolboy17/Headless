import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPosts, getCategories, getCategoryBySlug } from '@/lib/wordpress';
import { PostCard } from '@/components/post-card';
import { CategoryNav } from '@/components/category-nav';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    return { title: 'Category Not Found' };
  }

  return {
    title: category.name,
    description: category.description || `Explore articles in ${category.name}`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [category, categories, postsData] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getPosts({ category: slug, perPage: 12 }),
  ]);

  if (!category) {
    notFound();
  }

  const { posts, totalPosts } = postsData;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground">{category.description}</p>
          )}
        </div>

        <CategoryNav categories={categories} className="mb-8" />

        <div className="flex items-center justify-between mb-8">
          <span className="text-sm text-muted-foreground">{totalPosts} articles</span>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles found in this category.</p>
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
