import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPosts, getCategories, getCategoryBySlug, getAllCategorySlugs } from '@/lib/wordpress';
import { PostCard } from '@/components/post-card';
import { CategoryNav } from '@/components/category-nav';
import { Pagination } from '@/components/pagination';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getAllCategorySlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // Return empty array to allow dynamic generation at request time
    return [];
  }
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cursedtours.com';

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  
  if (!category) {
    return { title: 'Category Not Found' };
  }

  const canonicalUrl = `${SITE_URL}/category/${slug}`;
  const description = category.description || `Explore haunted locations, paranormal investigations, and ghost stories in ${category.name}. Discover the dark history and supernatural encounters.`;

  return {
    title: `${category.name} | Cursed Tours`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.name} | Cursed Tours`,
      description,
      type: 'website',
      url: canonicalUrl,
      siteName: 'Cursed Tours',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${category.name} | Cursed Tours`,
      description,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const requestedPage = Math.max(1, parseInt(page || '1', 10));
  const postsPerPage = 12;

  const [category, categories, postsData] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getPosts({ category: slug, perPage: postsPerPage, page: requestedPage }),
  ]);

  if (!category) {
    notFound();
  }

  const { posts, totalPosts, totalPages } = postsData;
  
  const currentPage = Math.min(requestedPage, Math.max(1, totalPages));
  if (requestedPage > totalPages && totalPages > 0) {
    redirect(totalPages === 1 ? `/category/${slug}` : `/category/${slug}?page=${totalPages}`);
  }

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

        <div className="flex items-center justify-between gap-4 mb-8">
          <span className="text-sm text-muted-foreground">
            {currentPage > 1 ? `Page ${currentPage} of ${totalPages} - ` : ''}{totalPosts} articles
          </span>
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

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          basePath={`/category/${slug}`} 
        />
      </div>
    </div>
  );
}
