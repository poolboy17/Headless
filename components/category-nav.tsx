'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WPCategory } from '@/lib/wordpress';

interface CategoryNavProps {
  categories: WPCategory[];
  className?: string;
}

export function CategoryNav({ categories, className }: CategoryNavProps) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);
  const rafRef = useRef<number>(0);

  const checkScroll = () => {
    // Cancel any pending RAF to avoid stacking
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    // Batch layout reads in RAF to avoid forced reflows
    rafRef.current = requestAnimationFrame(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftFade(scrollLeft > 10);
        setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
      }
    });
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', checkScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Left fade and button */}
      {showLeftFade && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white dark:bg-neutral-800 shadow-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Right fade and button */}
      {showRightFade && (
        <>
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white dark:bg-neutral-800 shadow-md border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Scrollable nav */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-hide px-1"
        onScroll={checkScroll}
      >
        <nav className="flex gap-2 pb-2" data-testid="category-nav">
          <Link
            href="/"
            className={cn(
              'cursor-pointer whitespace-nowrap text-sm px-4 py-2 rounded-full font-medium transition-all',
              pathname === '/'
                ? 'bg-primary text-primary-foreground shadow-md'
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
                'cursor-pointer whitespace-nowrap text-sm px-4 py-2 rounded-full font-medium transition-all',
                pathname === `/category/${category.slug}`
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-foreground hover:bg-neutral-200 dark:hover:bg-neutral-700'
              )}
              data-testid={`category-${category.slug}`}
            >
              {category.name}
              <span className="ml-1.5 text-xs opacity-60">({category.count})</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
