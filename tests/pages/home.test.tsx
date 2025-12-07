import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/hero-section';
import { PostCard } from '@/components/post-card';
import { CategoryNav } from '@/components/category-nav';
import type { WPPost, WPCategory } from '@/lib/wordpress';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const createMockPost = (overrides?: Partial<WPPost>): WPPost => ({
  id: 1,
  date: '2024-01-15T10:30:00',
  date_gmt: '2024-01-15T10:30:00',
  modified: '2024-01-15T10:30:00',
  modified_gmt: '2024-01-15T10:30:00',
  slug: 'test-post',
  status: 'publish',
  type: 'post',
  link: 'https://example.com/test-post',
  title: { rendered: 'Haunted House Investigation' },
  content: { rendered: '<p>Deep in the woods...</p>' },
  excerpt: { rendered: '<p>A spooky tale of paranormal activity.</p>' },
  author: 1,
  featured_media: 1,
  categories: [1],
  tags: [1],
  _embedded: {
    author: [{
      id: 1,
      name: 'Marcus Hale',
      slug: 'marcus-hale',
      link: 'https://example.com/author/marcus-hale',
    }],
    'wp:featuredmedia': [{
      id: 1,
      source_url: 'https://example.com/image.jpg',
      alt_text: 'Haunted house',
      media_details: {
        width: 1200,
        height: 800,
      },
    }],
    'wp:term': [
      [{ id: 1, count: 10, name: 'Ghost Stories', slug: 'ghost-stories', link: '' }],
      [{ id: 1, count: 5, name: 'Haunted', slug: 'haunted', link: '' }],
    ],
  },
  ...overrides,
});

const mockCategories: WPCategory[] = [
  { id: 1, count: 25, name: 'Ghost Stories', slug: 'ghost-stories', link: '' },
  { id: 2, count: 20, name: 'Investigations', slug: 'investigations', link: '' },
  { id: 3, count: 15, name: 'Haunted Places', slug: 'haunted-places', link: '' },
];

describe('Homepage Integration', () => {
  describe('Hero Section with post data', () => {
    it('renders featured post title', () => {
      const post = createMockPost();
      render(<HeroSection post={post} />);
      expect(screen.getByText('Haunted House Investigation')).toBeInTheDocument();
    });

    it('displays post excerpt', () => {
      const post = createMockPost();
      render(<HeroSection post={post} />);
      expect(screen.getByText(/spooky tale/i)).toBeInTheDocument();
    });

    it('displays category badge', () => {
      const post = createMockPost();
      render(<HeroSection post={post} />);
      expect(screen.getByText('Ghost Stories')).toBeInTheDocument();
    });

    it('shows formatted date', () => {
      const post = createMockPost();
      render(<HeroSection post={post} />);
      expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
    });

    it('includes link to full post', () => {
      const post = createMockPost();
      render(<HeroSection post={post} />);
      const links = screen.getAllByRole('link');
      const postLink = links.find(link => link.getAttribute('href')?.includes('/post/test-post'));
      expect(postLink).toBeDefined();
    });
  });

  describe('Post Grid with multiple posts', () => {
    it('renders multiple post cards', () => {
      const posts = [
        createMockPost({ id: 1, slug: 'post-1', title: { rendered: 'First Post' } }),
        createMockPost({ id: 2, slug: 'post-2', title: { rendered: 'Second Post' } }),
        createMockPost({ id: 3, slug: 'post-3', title: { rendered: 'Third Post' } }),
      ];

      const { container } = render(
        <div data-testid="post-grid">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      );

      expect(screen.getByText('First Post')).toBeInTheDocument();
      expect(screen.getByText('Second Post')).toBeInTheDocument();
      expect(screen.getByText('Third Post')).toBeInTheDocument();
    });

    it('each card links to its post page', () => {
      const posts = [
        createMockPost({ id: 1, slug: 'ghost-encounter' }),
        createMockPost({ id: 2, slug: 'shadow-people' }),
      ];

      render(
        <div>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      );

      const links = screen.getAllByRole('link');
      const hrefs = links.map(link => link.getAttribute('href'));
      expect(hrefs).toContain('/post/ghost-encounter');
      expect(hrefs).toContain('/post/shadow-people');
    });

    it('displays reading time on each card', () => {
      const post = createMockPost({
        content: { rendered: Array(1000).fill('word').join(' ') }
      });
      render(<PostCard post={post} />);
      expect(screen.getByText(/\d+ min/)).toBeInTheDocument();
    });
  });

  describe('Category Navigation', () => {
    it('renders all provided categories', () => {
      render(<CategoryNav categories={mockCategories} />);
      expect(screen.getByText('Ghost Stories')).toBeInTheDocument();
      expect(screen.getByText('Investigations')).toBeInTheDocument();
      expect(screen.getByText('Haunted Places')).toBeInTheDocument();
    });

    it('includes "All" button for homepage', () => {
      render(<CategoryNav categories={mockCategories} />);
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    it('highlights active category based on pathname', () => {
      render(<CategoryNav categories={mockCategories} />);
      const categoryLink = screen.getByTestId('category-ghost-stories');
      expect(categoryLink).toBeInTheDocument();
    });

    it('each category links to its archive page', () => {
      render(<CategoryNav categories={mockCategories} />);
      const ghostLink = screen.getByTestId('category-ghost-stories');
      expect(ghostLink).toHaveAttribute('href', '/category/ghost-stories');
    });
  });
});
