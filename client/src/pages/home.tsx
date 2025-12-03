import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection, HeroSkeleton } from "@/components/hero-section";
import { CategoryNav, CategoryNavSkeleton } from "@/components/category-nav";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import type { PostsResponse, WPCategory } from "@shared/schema";

interface HomeProps {
  categories: WPCategory[];
  onSearch?: (query: string) => void;
}

export default function Home({ categories, onSearch }: HomeProps) {
  const [location, setLocation] = useLocation();
  
  // Parse page from URL
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading, error } = useQuery<PostsResponse>({
    queryKey: ["/api/posts", { page: currentPage, perPage: 10 }],
  });

  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;
  const featuredPost = posts[0];
  const gridPosts = posts.slice(1);

  const handlePageChange = (page: number) => {
    if (page === 1) {
      setLocation("/");
    } else {
      setLocation(`/?page=${page}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Unable to load posts</h2>
        <p className="text-muted-foreground mb-6">
          There was an error connecting to the WordPress API. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()} data-testid="button-retry">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Hero Section */}
      <div className="bg-white dark:bg-neutral-900">
        {isLoading ? (
          <HeroSkeleton />
        ) : featuredPost ? (
          <HeroSection post={featuredPost} />
        ) : null}
      </div>

      {/* Category Navigation */}
      {isLoading ? (
        <CategoryNavSkeleton />
      ) : (
        <CategoryNav categories={categories} />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 md:py-16">
        {/* Featured Posts Grid */}
        {currentPage === 1 && gridPosts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-bold" data-testid="section-featured">
                Featured Stories
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <PostCardSkeleton key={i} variant="featured" />
                  ))
                : gridPosts.slice(0, 3).map((post) => (
                    <PostCard key={post.id} post={post} variant="featured" />
                  ))}
            </div>
          </section>
        )}

        {/* All Posts Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold" data-testid="section-latest">
              {currentPage === 1 ? "Latest Articles" : `Page ${currentPage}`}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <PostCardSkeleton key={i} />
                ))
              : (currentPage === 1 ? gridPosts.slice(3) : posts).map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
          </div>

          {/* Empty State */}
          {!isLoading && posts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No posts found.</p>
            </div>
          )}
        </section>

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
