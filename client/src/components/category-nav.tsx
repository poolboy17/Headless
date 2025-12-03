import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { WPCategory } from "@shared/schema";

interface CategoryNavProps {
  categories: WPCategory[];
  activeCategory?: string;
}

export function CategoryNav({ categories, activeCategory }: CategoryNavProps) {
  const [location] = useLocation();

  return (
    <div className="sticky top-16 sm:top-20 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-b border-neutral-200/70 dark:border-neutral-800">
      <div className="container mx-auto px-4">
        <ScrollArea className="py-4">
          <div className="flex gap-2 items-center">
            <Link href="/">
              <Badge
                variant={location === "/" ? "default" : "secondary"}
                className="cursor-pointer whitespace-nowrap text-sm px-4 py-2 rounded-full font-medium"
                data-testid="category-all"
              >
                All Posts
              </Badge>
            </Link>
            {categories.map((category) => {
              const isActive = activeCategory === category.slug || location === `/category/${category.slug}`;
              return (
                <Link key={category.id} href={`/category/${category.slug}`}>
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className="cursor-pointer whitespace-nowrap text-sm px-4 py-2 rounded-full font-medium"
                    data-testid={`category-${category.slug}`}
                  >
                    {category.name}
                  </Badge>
                </Link>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

export function CategoryNavSkeleton() {
  return (
    <div className="sticky top-16 sm:top-20 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200/70 dark:border-neutral-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
