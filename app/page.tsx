import { getPosts, getCategories } from '@/lib/wordpress';
import { HeroSection } from '@/components/hero-section';
import { PostCard } from '@/components/post-card';
import { CategoryNav } from '@/components/category-nav';

export default async function HomePage() {
  const [postsData, categories] = await Promise.all([
    getPosts({ perPage: 10 }),
    getCategories(),
  ]);

  const { posts, totalPosts } = postsData;
  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);

  return (
    <div className="min-h-screen">
      {featuredPost && <HeroSection post={featuredPost} />}

      <div className="container mx-auto px-4 py-12">
        <CategoryNav categories={categories} className="mb-8" />

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Latest Articles</h2>
          <span className="text-sm text-muted-foreground">{totalPosts} articles</span>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {gridPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
