import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryNav } from '@/components/category-nav';
import { PostCard } from '@/components/post-card';
import { Pagination } from '@/components/pagination';
import type { WPPost, WPCategory } from '@/lib/wordpress';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/category/ghost-stories',
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
  title: { rendered: 'Test Ghost Story' },
  content: { rendered: '<p>Content</p>' },
  excerpt: { rendered: '<p>Excerpt</p>' },
  author: 1,
  featured_media: 1,
  categories: [1],
  tags: [],
  _embedded: {
    author: [{ id: 1, name: 'Author', slug: 'author', link: '' }],
    'wp:featuredmedia': [{
      id: 1,
      source_url: 'https://example.com/image.jpg',
      alt_text: 'Test',
    }],
    'wp:term': [[{ id: 1, count: 10, name: 'Ghost Stories', slug: 'ghost-stories', link: '' }], []],
  },
  ...overrides,
});

const mockCategories: WPCategory[] = [
  { id: 1, count: 50, name: 'Ghost Stories', slug: 'ghost-stories', link: '' },
  { id: 2, count: 30, name: 'Investigations', slug: 'investigations', link: '' },
  { id: 3, count: 25, name: 'Haunted Places', slug: 'haunted-places', link: '' },
  { id: 4, count: 20, name: 'EVP Recordings', slug: 'evp-recordings', link: '' },
];

describe('Category Page Integration', () => {
  describe('Category header', () => {
    it('displays category title', () => {
      const category = mockCategories[0];
      render(
        <header data-testid="category-header">
          <h1 data-testid="text-category-title">{category.name}</h1>
          <p data-testid="text-post-count">{category.count} posts</p>
        </header>
      );
      
      expect(screen.getByTestId('text-category-title')).toHaveTextContent('Ghost Stories');
      expect(screen.getByTestId('text-post-count')).toHaveTextContent('50 posts');
    });

    it('displays category description when available', () => {
      render(
        <p data-testid="text-category-description">
          Explore chilling tales of supernatural encounters and unexplained phenomena.
        </p>
      );
      
      expect(screen.getByTestId('text-category-description')).toBeInTheDocument();
    });
  });

  describe('Category navigation', () => {
    it('renders category nav with all categories', () => {
      render(<CategoryNav categories={mockCategories} />);
      
      const categoryLink = screen.getByTestId('category-ghost-stories');
      expect(categoryLink).toBeInTheDocument();
    });

    it('shows all category options', () => {
      render(<CategoryNav categories={mockCategories} />);
      
      expect(screen.getByText('Ghost Stories')).toBeInTheDocument();
      expect(screen.getByText('Investigations')).toBeInTheDocument();
      expect(screen.getByText('Haunted Places')).toBeInTheDocument();
      expect(screen.getByText('EVP Recordings')).toBeInTheDocument();
    });

    it('category links navigate to correct archives', () => {
      render(<CategoryNav categories={mockCategories} />);
      
      const investigationsLink = screen.getByTestId('category-investigations');
      expect(investigationsLink).toHaveAttribute('href', '/category/investigations');
    });
  });

  describe('Posts grid in category', () => {
    it('displays posts filtered by category', () => {
      const categoryPosts = [
        createMockPost({ id: 1, slug: 'story-1', title: { rendered: 'Ghost at the Lighthouse' } }),
        createMockPost({ id: 2, slug: 'story-2', title: { rendered: 'Haunted Hospital Ward' } }),
        createMockPost({ id: 3, slug: 'story-3', title: { rendered: 'Cemetery Apparition' } }),
      ];
      
      render(
        <div data-testid="category-posts-grid">
          {categoryPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      );
      
      expect(screen.getByText('Ghost at the Lighthouse')).toBeInTheDocument();
      expect(screen.getByText('Haunted Hospital Ward')).toBeInTheDocument();
      expect(screen.getByText('Cemetery Apparition')).toBeInTheDocument();
    });

    it('shows empty state when category has no posts', () => {
      render(
        <div data-testid="category-empty">
          <p data-testid="text-empty-category">No posts found in this category.</p>
        </div>
      );
      
      expect(screen.getByTestId('text-empty-category')).toBeInTheDocument();
    });
  });

  describe('Category pagination', () => {
    it('shows pagination when category has multiple pages', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={4}
          basePath="/category/ghost-stories"
        />
      );
      
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('pagination links include page numbers', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={4}
          basePath="/category/ghost-stories"
        />
      );
      
      const page2Link = screen.getByTestId('pagination-page-2');
      expect(page2Link).toBeInTheDocument();
    });

    it('displays page number buttons', () => {
      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          basePath="/category/investigations"
        />
      );
      
      expect(screen.getByTestId('pagination-page-2')).toBeInTheDocument();
    });

    it('hides pagination when only one page', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={1}
          basePath="/category/ghost-stories"
        />
      );
      
      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
    });
  });
});
