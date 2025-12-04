import { Ghost, Search, FileQuestion, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: 'ghost' | 'search' | 'file' | 'folder';
  actionLabel?: string;
  actionHref?: string;
}

const icons = {
  ghost: Ghost,
  search: Search,
  file: FileQuestion,
  folder: FolderOpen,
};

export function EmptyState({
  title = 'No posts found',
  description = "We couldn't find any posts matching your criteria.",
  icon = 'ghost',
  actionLabel = 'Go back home',
  actionHref = '/',
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Animated ghost icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full blur-2xl" />
        <div className="relative p-6 rounded-full bg-muted/50 border border-primary/10">
          <Icon className="h-16 w-16 text-primary/60" />
        </div>
      </div>

      {/* Text */}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>

      {/* Action button */}
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="outline" size="lg">
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}

// Specific empty states
export function NoPostsFound() {
  return (
    <EmptyState
      title="No articles yet"
      description="We're working on some spooky content. Check back soon for paranormal investigations and ghost stories."
      icon="ghost"
      actionLabel="Explore categories"
      actionHref="/"
    />
  );
}

export function NoSearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      title="No results found"
      description={
        query
          ? `We couldn't find any posts matching "${query}". Try different keywords or browse our categories.`
          : "Try searching for something else or browse our categories."
      }
      icon="search"
      actionLabel="Clear search"
      actionHref="/"
    />
  );
}

export function CategoryEmpty({ categoryName }: { categoryName?: string }) {
  return (
    <EmptyState
      title={`No posts in ${categoryName || 'this category'}`}
      description="This category doesn't have any posts yet. Check out our other categories for more content."
      icon="folder"
      actionLabel="Browse all posts"
      actionHref="/"
    />
  );
}
