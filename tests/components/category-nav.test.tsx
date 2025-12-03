import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryNav } from '@/components/category-nav';
import type { WPCategory } from '@/lib/wordpress';

const mockUsePathname = vi.fn(() => '/');

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

const mockCategories: WPCategory[] = [
  { id: 1, count: 25, name: 'Ghost Stories', slug: 'ghost-stories', link: '' },
  { id: 2, count: 20, name: 'Investigations', slug: 'investigations', link: '' },
  { id: 3, count: 15, name: 'Paranormal Activity', slug: 'paranormal-activity', link: '' },
];

describe('CategoryNav Component', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  describe('basic rendering', () => {
    it('renders the nav container', () => {
      render(<CategoryNav categories={mockCategories} />);
      expect(screen.getByTestId('category-nav')).toBeInTheDocument();
    });

    it('renders the All link', () => {
      render(<CategoryNav categories={mockCategories} />);
      const allLink = screen.getByTestId('category-all');
      expect(allLink).toHaveTextContent('All');
      expect(allLink).toHaveAttribute('href', '/');
    });

    it('renders all category links', () => {
      render(<CategoryNav categories={mockCategories} />);
      expect(screen.getByTestId('category-ghost-stories')).toBeInTheDocument();
      expect(screen.getByTestId('category-investigations')).toBeInTheDocument();
      expect(screen.getByTestId('category-paranormal-activity')).toBeInTheDocument();
    });

    it('renders category names correctly', () => {
      render(<CategoryNav categories={mockCategories} />);
      expect(screen.getByText('Ghost Stories')).toBeInTheDocument();
      expect(screen.getByText('Investigations')).toBeInTheDocument();
      expect(screen.getByText('Paranormal Activity')).toBeInTheDocument();
    });

    it('renders correct hrefs for category links', () => {
      render(<CategoryNav categories={mockCategories} />);
      expect(screen.getByTestId('category-ghost-stories')).toHaveAttribute('href', '/category/ghost-stories');
      expect(screen.getByTestId('category-investigations')).toHaveAttribute('href', '/category/investigations');
    });
  });

  describe('active state on homepage', () => {
    it('applies active styling to All when on homepage', () => {
      render(<CategoryNav categories={mockCategories} />);
      const allLink = screen.getByTestId('category-all');
      expect(allLink).toHaveClass('bg-primary');
    });

    it('does not apply active styling to categories when on homepage', () => {
      render(<CategoryNav categories={mockCategories} />);
      const categoryLink = screen.getByTestId('category-ghost-stories');
      expect(categoryLink).not.toHaveClass('bg-primary');
    });
  });

  describe('active state on category page', () => {
    beforeEach(() => {
      mockUsePathname.mockReturnValue('/category/ghost-stories');
    });

    it('applies active styling to matching category', () => {
      render(<CategoryNav categories={mockCategories} />);
      const categoryLink = screen.getByTestId('category-ghost-stories');
      expect(categoryLink).toHaveClass('bg-primary');
    });

    it('does not apply active styling to All when on category page', () => {
      render(<CategoryNav categories={mockCategories} />);
      const allLink = screen.getByTestId('category-all');
      expect(allLink).not.toHaveClass('bg-primary');
    });

    it('does not apply active styling to non-matching categories', () => {
      render(<CategoryNav categories={mockCategories} />);
      const otherCategory = screen.getByTestId('category-investigations');
      expect(otherCategory).not.toHaveClass('bg-primary');
    });
  });

  describe('empty state', () => {
    it('renders only All link when no categories', () => {
      render(<CategoryNav categories={[]} />);
      expect(screen.getByTestId('category-all')).toBeInTheDocument();
      expect(screen.queryByTestId('category-ghost-stories')).not.toBeInTheDocument();
    });
  });

  describe('custom className', () => {
    it('applies custom className to container', () => {
      const { container } = render(<CategoryNav categories={mockCategories} className="my-custom-class" />);
      expect(container.firstChild).toHaveClass('my-custom-class');
    });
  });
});
