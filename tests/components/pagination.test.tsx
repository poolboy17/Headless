import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Pagination } from '@/components/pagination';

const mockUsePathname = vi.fn(() => '/');
const mockUseSearchParams = vi.fn(() => new URLSearchParams());

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

describe('Pagination Component', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  describe('visibility rules', () => {
    it('returns null when totalPages is 0', () => {
      const { container } = render(<Pagination currentPage={1} totalPages={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when totalPages is 1', () => {
      const { container } = render(<Pagination currentPage={1} totalPages={1} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders when totalPages is greater than 1', () => {
      render(<Pagination currentPage={1} totalPages={2} />);
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
  });

  describe('navigation buttons', () => {
    it('disables prev button on first page', () => {
      render(<Pagination currentPage={1} totalPages={5} />);
      const prevButton = screen.getByTestId('pagination-prev');
      expect(prevButton).toBeDisabled();
    });

    it('enables prev button when not on first page', () => {
      render(<Pagination currentPage={2} totalPages={5} />);
      const prevButton = screen.getByTestId('pagination-prev');
      expect(prevButton.closest('a')).toBeInTheDocument();
    });

    it('disables next button on last page', () => {
      render(<Pagination currentPage={5} totalPages={5} />);
      const nextButton = screen.getByTestId('pagination-next');
      expect(nextButton).toBeDisabled();
    });

    it('enables next button when not on last page', () => {
      render(<Pagination currentPage={3} totalPages={5} />);
      const nextButton = screen.getByTestId('pagination-next');
      expect(nextButton.closest('a')).toBeInTheDocument();
    });

    it('prev button links to previous page', () => {
      render(<Pagination currentPage={3} totalPages={5} />);
      const prevLink = screen.getByTestId('pagination-prev').closest('a');
      expect(prevLink).toHaveAttribute('href', '/?page=2');
    });

    it('next button links to next page', () => {
      render(<Pagination currentPage={3} totalPages={5} />);
      const nextLink = screen.getByTestId('pagination-next').closest('a');
      expect(nextLink).toHaveAttribute('href', '/?page=4');
    });
  });

  describe('page number display', () => {
    it('shows all page numbers for small page counts', () => {
      render(<Pagination currentPage={2} totalPages={5} />);
      expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-page-2')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-page-3')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-page-4')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-page-5')).toBeInTheDocument();
    });

    it('highlights current page with default variant', () => {
      render(<Pagination currentPage={3} totalPages={5} />);
      const currentPageBtn = screen.getByTestId('pagination-page-3');
      expect(currentPageBtn.className).toContain('bg-primary');
    });

    it('non-current pages use outline variant', () => {
      render(<Pagination currentPage={3} totalPages={5} />);
      const otherPageBtn = screen.getByTestId('pagination-page-1');
      expect(otherPageBtn.className).toContain('border');
    });
  });

  describe('ellipsis rendering for large page counts', () => {
    it('shows ellipsis at start when on high page', () => {
      render(<Pagination currentPage={8} totalPages={10} />);
      expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-page-10')).toBeInTheDocument();
    });

    it('shows ellipsis at end when on low page', () => {
      render(<Pagination currentPage={2} totalPages={10} />);
      expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-page-10')).toBeInTheDocument();
    });

    it('shows ellipsis on both sides when in middle', () => {
      render(<Pagination currentPage={5} totalPages={10} />);
      const ellipses = screen.getAllByText('...');
      expect(ellipses.length).toBe(2);
    });
  });

  describe('URL generation', () => {
    it('removes page param for page 1', () => {
      render(<Pagination currentPage={2} totalPages={5} />);
      const page1Link = screen.getByTestId('pagination-page-1').closest('a');
      expect(page1Link).toHaveAttribute('href', '/');
    });

    it('adds page param for other pages', () => {
      render(<Pagination currentPage={1} totalPages={5} />);
      const page3Link = screen.getByTestId('pagination-page-3').closest('a');
      expect(page3Link).toHaveAttribute('href', '/?page=3');
    });

    it('uses basePath when provided', () => {
      render(<Pagination currentPage={1} totalPages={5} basePath="/category/ghost-stories" />);
      const page2Link = screen.getByTestId('pagination-page-2').closest('a');
      expect(page2Link).toHaveAttribute('href', '/category/ghost-stories?page=2');
    });

    it('preserves existing search params', () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams('search=haunted'));
      render(<Pagination currentPage={1} totalPages={5} />);
      const page2Link = screen.getByTestId('pagination-page-2').closest('a');
      expect(page2Link).toHaveAttribute('href', '/?search=haunted&page=2');
    });

    it('clamps page numbers to valid range', () => {
      render(<Pagination currentPage={5} totalPages={5} />);
      const page5Link = screen.getByTestId('pagination-page-5').closest('a');
      expect(page5Link).toHaveAttribute('href', '/?page=5');
    });
  });

  describe('accessibility', () => {
    it('has aria-label on pagination nav', () => {
      render(<Pagination currentPage={2} totalPages={5} />);
      const nav = screen.getByTestId('pagination');
      expect(nav).toHaveAttribute('aria-label', 'Pagination');
    });

    it('has sr-only text for prev button', () => {
      render(<Pagination currentPage={2} totalPages={5} />);
      expect(screen.getByText('Previous page')).toHaveClass('sr-only');
    });

    it('has sr-only text for next button', () => {
      render(<Pagination currentPage={2} totalPages={5} />);
      expect(screen.getByText('Next page')).toHaveClass('sr-only');
    });
  });
});
