import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryNav, CategoryNavSkeleton } from "@/components/category-nav";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import type { PostsResponse, WPCategory } from "@shared/schema";

interface CategoryPageProps {
  categories: WPCategory[];
}

export default function CategoryPage({ categories }: CategoryPageProps) {
  const [, params] = useRoute("/category/:slug");
  const [location, setLocation] = useLocation();
  const slug = params?.slug;

  // Parse page from URL
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Find category
  const category = categories.find((c) => c.slug === slug);

  const { data, isLoading, error } = useQuery<PostsResponse>({
    queryKey: ["/api/posts", { page: currentPage, perPage: 12, category: slug }],
    enabled: !!slug,
  });

  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;

  const handlePageChange = (page: number) => {
    if (page === 1) {
      setLocation(`/category/${slug}`);
    } else {
      setLocation(`/category/${slug}?page=${page}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Category not found</h2>
        <p className="text-muted-foreground mb-6">
          The category you're looking for doesn't exist.
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

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Category Navigation */}
      <div className="bg-white dark:bg-neutral-900">
        {isLoading && !categories.length ? (
          <CategoryNavSkeleton />
        ) : (
          <CategoryNav categories={categories} activeCategory={slug} />
        )}

        {/* Category Header */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to all posts
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary/10">
              <FolderOpen className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold" data-testid="category-title">
                {category?.name || slug}
              </h1>
              {category && (
                <p className="text-muted-foreground mt-1">
                  {category.count} {category.count === 1 ? "article" : "articles"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <main className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {isLoading
            ? Array.from({ length: 9 }).map((_, i) => (
                <PostCardSkeleton key={i} variant="featured" />
              ))
            : posts.map((post) => (
                <PostCard key={post.id} post={post} variant="featured" />
              ))}
        </div>

        {/* Empty State */}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-16">
            <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No posts in this category</h2>
            <p className="text-muted-foreground mb-6">
              Check back later for new content.
            </p>
            <Link href="/">
              <Button data-testid="button-browse-all">
                Browse All Posts
              </Button>
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 mt-16" data-testid="pagination">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-full"
              data-testid="button-prev-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => handlePageChange(pageNum)}
                  className="rounded-full"
                  data-testid={`button-page-${pageNum}`}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-full"
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        )}
      </main>
    </div>
  );
}
