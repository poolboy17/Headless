import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/footer';
import type { WPCategory, WPPost } from '@/lib/wordpress';

vi.mock('@/components/newsletter-signup', () => ({
  NewsletterSignup: () => <div data-testid="newsletter-signup">Newsletter Signup</div>,
}));

const mockCategories: WPCategory[] = [
  { id: 1, count: 25, name: 'Ghost Stories', slug: 'ghost-stories', link: '' },
  { id: 2, count: 20, name: 'Investigations', slug: 'investigations', link: '' },
  { id: 3, count: 15, name: 'Paranormal', slug: 'paranormal', link: '' },
  { id: 4, count: 10, name: 'Haunted Places', slug: 'haunted-places', link: '' },
  { id: 5, count: 5, name: 'EVP', slug: 'evp', link: '' },
  { id: 6, count: 3, name: 'Extra Category', slug: 'extra-category', link: '' },
];

const mockRecentPosts: Partial<WPPost>[] = [
  { id: 1, slug: 'post-1', title: { rendered: 'Recent Post One' } },
  { id: 2, slug: 'post-2', title: { rendered: 'Recent Post Two' } },
  { id: 3, slug: 'post-3', title: { rendered: 'Recent Post Three' } },
  { id: 4, slug: 'post-4', title: { rendered: 'Recent Post Four' } },
  { id: 5, slug: 'post-5', title: { rendered: 'Recent Post Five' } },
];

describe('Footer Component', () => {
  describe('branding', () => {
    it('renders the site title', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByText('CURSED TOURS')).toBeInTheDocument();
    });

    it('renders the tagline', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByText(/Some boundaries aren't meant to be crossed/)).toBeInTheDocument();
    });

    it('renders copyright with current year', () => {
      render(<Footer categories={mockCategories} />);
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument();
    });
  });

  describe('about section', () => {
    it('renders Home link', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    });

    it('renders About Us link', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about');
    });

    it('renders Contact link', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
    });
  });

  describe('categories section', () => {
    it('renders first 5 categories', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByTestId('footer-category-ghost-stories')).toBeInTheDocument();
      expect(screen.getByTestId('footer-category-investigations')).toBeInTheDocument();
      expect(screen.getByTestId('footer-category-paranormal')).toBeInTheDocument();
      expect(screen.getByTestId('footer-category-haunted-places')).toBeInTheDocument();
      expect(screen.getByTestId('footer-category-evp')).toBeInTheDocument();
    });

    it('does not render more than 5 categories', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.queryByTestId('footer-category-extra-category')).not.toBeInTheDocument();
    });

    it('renders category links with correct href', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByTestId('footer-category-ghost-stories')).toHaveAttribute('href', '/category/ghost-stories');
    });
  });

  describe('recent posts section', () => {
    it('renders recent posts', () => {
      render(<Footer categories={mockCategories} recentPosts={mockRecentPosts as WPPost[]} />);
      expect(screen.getByTestId('footer-post-1')).toBeInTheDocument();
      expect(screen.getByTestId('footer-post-2')).toBeInTheDocument();
    });

    it('limits to 4 recent posts', () => {
      render(<Footer categories={mockCategories} recentPosts={mockRecentPosts as WPPost[]} />);
      expect(screen.getByTestId('footer-post-1')).toBeInTheDocument();
      expect(screen.getByTestId('footer-post-4')).toBeInTheDocument();
      expect(screen.queryByTestId('footer-post-5')).not.toBeInTheDocument();
    });

    it('renders post links with correct href', () => {
      render(<Footer categories={mockCategories} recentPosts={mockRecentPosts as WPPost[]} />);
      expect(screen.getByTestId('footer-post-1')).toHaveAttribute('href', '/post/post-1');
    });

    it('renders post titles', () => {
      render(<Footer categories={mockCategories} recentPosts={mockRecentPosts as WPPost[]} />);
      expect(screen.getByText('Recent Post One')).toBeInTheDocument();
    });

    it('handles empty recent posts gracefully', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.queryByTestId('footer-post-1')).not.toBeInTheDocument();
    });
  });

  describe('legal section', () => {
    it('renders Privacy Policy link', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    });

    it('renders Terms of Service link', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms');
    });
  });

  describe('social links', () => {
    it('renders Twitter/X link', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByTestId('social-twitter')).toBeInTheDocument();
    });

    it('renders Facebook link', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByTestId('social-facebook')).toBeInTheDocument();
    });

    it('renders Instagram link', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByTestId('social-instagram')).toBeInTheDocument();
    });

    it('renders YouTube link', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByTestId('social-youtube')).toBeInTheDocument();
    });
  });

  describe('newsletter', () => {
    it('renders newsletter signup component', () => {
      render(<Footer categories={mockCategories} />);
      expect(screen.getByTestId('newsletter-signup')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders footer with no categories', () => {
      render(<Footer categories={[]} />);
      expect(screen.getByText('CURSED TOURS')).toBeInTheDocument();
    });
  });
});
