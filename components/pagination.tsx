'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath?: string;
}

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number): string => {
    const clampedPage = Math.max(1, Math.min(page, totalPages));
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (clampedPage === 1) {
      params.delete('page');
    } else {
      params.set('page', clampedPage.toString());
    }
    const queryString = params.toString();
    const path = basePath || pathname || '/';
    return queryString ? `${path}?${queryString}` : path;
  };

  const getVisiblePages = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (showEllipsisStart) {
        pages.push('ellipsis');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (showEllipsisEnd) {
        pages.push('ellipsis');
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav className="flex items-center justify-center gap-1 mt-12" aria-label="Pagination" data-testid="pagination">
      {canGoPrev ? (
        <Link href={createPageUrl(currentPage - 1)}>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            data-testid="pagination-prev"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Button>
        </Link>
      ) : (
        <Button
          variant="outline"
          size="icon"
          disabled
          className="h-9 w-9"
          data-testid="pagination-prev"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
      )}

      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground" data-testid={`pagination-ellipsis-${index}`}>
                ...
              </span>
            );
          }

          const isActive = page === currentPage;
          return (
            <Link key={page} href={createPageUrl(page)}>
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                data-testid={`pagination-page-${page}`}
              >
                {page}
              </Button>
            </Link>
          );
        })}
      </div>

      {canGoNext ? (
        <Link href={createPageUrl(currentPage + 1)}>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            data-testid="pagination-next"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Button>
        </Link>
      ) : (
        <Button
          variant="outline"
          size="icon"
          disabled
          className="h-9 w-9"
          data-testid="pagination-next"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      )}
    </nav>
  );
}
