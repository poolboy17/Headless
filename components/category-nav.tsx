'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { WPCategory } from '@/lib/wordpress';

interface CategoryNavProps {
  categories: WPCategory[];
  className?: string;
}

export function CategoryNav({ categories, className }: CategoryNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn('overflow-x-auto scrollbar-hide', className)}>
      <nav className="flex gap-2 pb-2" data-testid="category-nav">
        <Link
          href="/"
          className={cn(
            'cursor-pointer whitespace-nowrap text-sm px-4 py-2 rounded-full font-medium transition-colors',
            pathname === '/'
              ? 'bg-primary text-primary-foreground'
              : 'bg-neutral-100 dark:bg-neutral-800 text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700'
          )}
          data-testid="category-all"
        >
          All
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className={cn(
              'cursor-pointer whitespace-nowrap text-sm px-4 py-2 rounded-full font-medium transition-colors',
              pathname === `/category/${category.slug}`
                ? 'bg-primary text-primary-foreground'
                : 'bg-neutral-100 dark:bg-neutral-800 text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700'
            )}
            data-testid={`category-${category.slug}`}
          >
            {category.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
