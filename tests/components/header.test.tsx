import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/header';
import type { WPCategory } from '@/lib/wordpress';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}));

const mockCategories: WPCategory[] = [
  { id: 1, count: 25, name: 'Ghost Stories', slug: 'ghost-stories', link: '' },
  { id: 2, count: 20, name: 'Investigations', slug: 'investigations', link: '' },
  { id: 3, count: 15, name: 'Paranormal', slug: 'paranormal', link: '' },
  { id: 4, count: 10, name: 'Haunted Places', slug: 'haunted-places', link: '' },
  { id: 5, count: 5, name: 'EVP', slug: 'evp', link: '' },
];

describe('Header Component', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  describe('branding', () => {
    it('renders the site title', () => {
      render(<Header categories={mockCategories} />);
      expect(screen.getAllByText('CURSED TOURS')[0]).toBeInTheDocument();
    });

    it('renders the site tagline', () => {
      render(<Header categories={mockCategories} />);
      expect(screen.getAllByText(/Some boundaries aren't meant to be crossed/)[0]).toBeInTheDocument();
    });

    it('renders home link', () => {
      render(<Header categories={mockCategories} />);
      const homeLink = screen.getByTestId('link-home');
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('desktop navigation', () => {
    it('renders navigation buttons for first 4 categories', () => {
      render(<Header categories={mockCategories} />);
      expect(screen.getByTestId('nav-category-ghost-stories')).toBeInTheDocument();
      expect(screen.getByTestId('nav-category-investigations')).toBeInTheDocument();
      expect(screen.getByTestId('nav-category-paranormal')).toBeInTheDocument();
      expect(screen.getByTestId('nav-category-haunted-places')).toBeInTheDocument();
      expect(screen.queryByTestId('nav-category-evp')).not.toBeInTheDocument();
    });

    it('renders home navigation button', () => {
      render(<Header categories={mockCategories} />);
      expect(screen.getByTestId('nav-home')).toBeInTheDocument();
    });
  });

  describe('desktop search', () => {
    it('renders search input on desktop', () => {
      render(<Header categories={mockCategories} />);
      expect(screen.getByTestId('input-search')).toBeInTheDocument();
    });

    it('submits search and navigates to search page', async () => {
      const user = userEvent.setup();
      render(<Header categories={mockCategories} />);
      
      const searchInput = screen.getByTestId('input-search');
      await user.type(searchInput, 'haunted house');
      await user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith('/search?q=haunted%20house');
    });

    it('does not submit empty search', async () => {
      const user = userEvent.setup();
      render(<Header categories={mockCategories} />);
      
      const searchInput = screen.getByTestId('input-search');
      await user.click(searchInput);
      await user.keyboard('{Enter}');

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('trims whitespace from search query', async () => {
      const user = userEvent.setup();
      render(<Header categories={mockCategories} />);
      
      const searchInput = screen.getByTestId('input-search');
      await user.type(searchInput, '  ghost   ');
      await user.keyboard('{Enter}');

      expect(mockPush).toHaveBeenCalledWith('/search?q=ghost');
    });
  });

  describe('mobile elements', () => {
    it('renders mobile menu button', () => {
      render(<Header categories={mockCategories} />);
      expect(screen.getByTestId('button-mobile-menu')).toBeInTheDocument();
    });

    it('renders mobile search button', () => {
      render(<Header categories={mockCategories} />);
      expect(screen.getByTestId('button-search-mobile')).toBeInTheDocument();
    });

    it('renders mobile home link', () => {
      render(<Header categories={mockCategories} />);
      expect(screen.getByTestId('link-home-mobile')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label on mobile menu button', () => {
      render(<Header categories={mockCategories} />);
      const menuButton = screen.getByTestId('button-mobile-menu');
      expect(menuButton).toHaveAttribute('aria-label', 'Open menu');
    });

    it('has proper aria-label on mobile search button', () => {
      render(<Header categories={mockCategories} />);
      const searchButton = screen.getByTestId('button-search-mobile');
      expect(searchButton).toHaveAttribute('aria-label', 'Search');
    });
  });

  describe('empty categories', () => {
    it('renders without categories gracefully', () => {
      render(<Header categories={[]} />);
      expect(screen.getByTestId('nav-home')).toBeInTheDocument();
      expect(screen.queryByTestId('nav-category-ghost-stories')).not.toBeInTheDocument();
    });
  });
});
