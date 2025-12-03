import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Home from "@/pages/home";
import SinglePost from "@/pages/single-post";
import CategoryPage from "@/pages/category";
import SearchPage from "@/pages/search";
import NotFound from "@/pages/not-found";
import type { WPCategory, PostsResponse } from "@shared/schema";

function AppContent() {
  const [, setLocation] = useLocation();

  // Fetch categories
  const { data: categories = [] } = useQuery<WPCategory[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch recent posts for footer
  const { data: postsData } = useQuery<PostsResponse>({
    queryKey: ["/api/posts", { page: 1, perPage: 4 }],
  });

  const handleSearch = (query: string) => {
    setLocation(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} onSearch={handleSearch} />
      <div className="flex-1">
        <Switch>
          <Route path="/" component={() => <Home categories={categories} onSearch={handleSearch} />} />
          <Route path="/post/:slug" component={SinglePost} />
          <Route path="/category/:slug" component={() => <CategoryPage categories={categories} />} />
          <Route path="/search" component={SearchPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <Footer categories={categories} recentPosts={postsData?.posts} />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="cursed-tours-theme">
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
