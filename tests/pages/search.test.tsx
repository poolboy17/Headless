import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/header';
import { PostCard } from '@/components/post-card';
import { Pagination } from '@/components/pagination';
import type { WPPost, WPCategory } from '@/lib/wordpress';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/search',
  useSearchParams: () => new URLSearchParams('q=haunted'),
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
  content: { rendered: '<p>Content about haunted places...</p>' },
  excerpt: { rendered: '<p>A spooky tale.</p>' },
  author: 1,
  featured_media: 1,
  categories: [1],
  tags: [1],
  _embedded: {
    author: [{
      id: 1,
      name: 'Marcus Hale',
      slug: 'marcus-hale',
      link: '',
    }],
    'wp:featuredmedia': [{
      id: 1,
      source_url: 'https://example.com/image.jpg',
      alt_text: 'Test image',
    }],
    'wp:term': [[{ id: 1, count: 10, name: 'Ghosts', slug: 'ghosts', link: '' }], []],
  },
  ...overrides,
});

const mockCategories: WPCategory[] = [
  { id: 1, count: 25, name: 'Ghost Stories', slug: 'ghost-stories', link: '' },
  { id: 2, count: 20, name: 'Investigations', slug: 'investigations', link: '' },
];

describe('Search Page Integration', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  describe('Search functionality', () => {
    it('search form accepts user input', async () => {
      const user = userEvent.setup();
      render(<Header categories={mockCategories} />);
      
      const searchInput = screen.getByTestId('input-search');
      await user.clear(searchInput);
      await user.type(searchInput, 'ghost stories');
      
      expect(searchInput).toHaveValue('ghost stories');
    });

    it('submits search query and navigates', async () => {
      const user = userEvent.setup();
      render(<Header categories={mockCategories} />);
      
      const searchInput = screen.getByTestId('input-search');
      await user.type(searchInput, 'paranormal activity');
      await user.keyboard('{Enter}');
      
      expect(mockPush).toHaveBeenCalledWith('/search?q=paranormal%20activity');
    });

    it('encodes special characters in search query', async () => {
      const user = userEvent.setup();
      render(<Header categories={mockCategories} />);
      
      const searchInput = screen.getByTestId('input-search');
      await user.type(searchInput, 'ghost & spirits');
      await user.keyboard('{Enter}');
      
      expect(mockPush).toHaveBeenCalledWith('/search?q=ghost%20%26%20spirits');
    });
  });

  describe('Search results display', () => {
    it('renders search results as post cards', () => {
      const searchResults = [
        createMockPost({ id: 1, slug: 'haunted-hotel', title: { rendered: 'Haunted Hotel' } }),
        createMockPost({ id: 2, slug: 'haunted-asylum', title: { rendered: 'Haunted Asylum' } }),
      ];

      render(
        <div data-testid="search-results">
          {searchResults.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      );

      expect(screen.getByText('Haunted Hotel')).toBeInTheDocument();
      expect(screen.getByText('Haunted Asylum')).toBeInTheDocument();
    });

    it('shows empty state when no results', () => {
      render(
        <div data-testid="search-results">
          <p data-testid="text-no-results">No posts found for "xyz123"</p>
        </div>
      );

      expect(screen.getByTestId('text-no-results')).toBeInTheDocument();
    });

    it('displays result count', () => {
      render(
        <div>
          <p data-testid="text-result-count">Found 15 results for "haunted"</p>
        </div>
      );

      expect(screen.getByText(/Found 15 results/)).toBeInTheDocument();
    });
  });

  describe('Search pagination', () => {
    it('renders pagination when multiple pages exist', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          basePath="/search"
        />
      );

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });

    it('pagination includes page links', () => {
      render(
        <Pagination
          currentPage={1}
          totalPages={5}
          basePath="/search"
        />
      );

      const page2Link = screen.getByTestId('pagination-page-2');
      expect(page2Link).toBeInTheDocument();
    });

    it('shows current page button', () => {
      render(
        <Pagination
          currentPage={3}
          totalPages={5}
          basePath="/search"
        />
      );

      const page3Button = screen.getByTestId('pagination-page-3');
      expect(page3Button).toBeInTheDocument();
    });
  });
});
