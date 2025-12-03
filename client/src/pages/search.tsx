import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostCard, PostCardSkeleton } from "@/components/post-card";
import type { PostsResponse } from "@shared/schema";
import { useState } from "react";

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  
  // Parse search query and page from URL
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const query = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  
  const [searchInput, setSearchInput] = useState(query);

  const { data, isLoading, error } = useQuery<PostsResponse>({
    queryKey: ["/api/posts", { page: currentPage, perPage: 12, search: query }],
    enabled: !!query,
  });

  const posts = data?.posts || [];
  const totalPages = data?.totalPages || 1;
  const totalPosts = data?.totalPosts || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handlePageChange = (page: number) => {
    if (page === 1) {
      setLocation(`/search?q=${encodeURIComponent(query)}`);
    } else {
      setLocation(`/search?q=${encodeURIComponent(query)}&page=${page}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      {/* Search Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to all posts
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold" data-testid="search-title">
                Search Results
              </h1>
              {query && !isLoading && (
                <p className="text-muted-foreground mt-1">
                  {totalPosts} {totalPosts === 1 ? "result" : "results"} for "{query}"
                </p>
              )}
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-xl">
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder="Search posts..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1"
                data-testid="input-search"
              />
              <Button type="submit" data-testid="button-search">
                Search
              </Button>
            </div>
          </form>
        </div>
      </header>

      {/* Search Results */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {!query ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Enter a search term</h2>
            <p className="text-muted-foreground">
              Use the search box above to find posts.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div className="text-center py-12">
                <SearchX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No results found</h2>
                <p className="text-muted-foreground mb-6">
                  Try different keywords or browse all posts.
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
              <nav className="flex items-center justify-center gap-2 mt-12" data-testid="pagination">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
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
                  data-testid="button-next-page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}
