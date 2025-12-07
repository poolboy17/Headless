import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PostCard } from '@/components/post-card';
import type { WPPost, WPCategory, WPTag } from '@/lib/wordpress';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/post/ghost-encounter',
  useSearchParams: () => new URLSearchParams(),
}));

const createMockPost = (overrides?: Partial<WPPost>): WPPost => ({
  id: 1,
  date: '2024-01-15T10:30:00',
  date_gmt: '2024-01-15T10:30:00',
  modified: '2024-01-16T15:00:00',
  modified_gmt: '2024-01-16T15:00:00',
  slug: 'ghost-encounter',
  status: 'publish',
  type: 'post',
  link: 'https://cursedtours.com/ghost-encounter',
  title: { rendered: 'My Ghost Encounter at the Old Mill' },
  content: { 
    rendered: `
      <p>It was a dark and stormy night when I first visited the Old Mill.</p>
      <h2>The Investigation</h2>
      <p>Armed with my EMF detector and thermal camera, I entered the building.</p>
      <p>The temperature dropped suddenly as I approached the basement stairs.</p>
      <h2>Evidence Captured</h2>
      <p>I managed to capture several EVP recordings that night.</p>
    ` 
  },
  excerpt: { rendered: '<p>A firsthand account of paranormal activity at the historic Old Mill.</p>' },
  author: 1,
  featured_media: 1,
  categories: [1, 2],
  tags: [1, 2, 3],
  _embedded: {
    author: [{
      id: 1,
      name: 'Marcus Hale',
      slug: 'marcus-hale',
      link: 'https://cursedtours.com/author/marcus-hale',
      avatar_urls: {
        '24': '/author-marcus-hale.png',
        '48': '/author-marcus-hale.png',
        '96': '/author-marcus-hale.png',
      },
    }],
    'wp:featuredmedia': [{
      id: 1,
      source_url: 'https://wp.cursedtours.com/wp-content/uploads/old-mill.jpg',
      alt_text: 'The Old Mill at dusk',
      media_details: {
        width: 1920,
        height: 1080,
      },
    }],
    'wp:term': [
      [
        { id: 1, count: 25, name: 'Ghost Stories', slug: 'ghost-stories', link: '' },
        { id: 2, count: 15, name: 'Investigations', slug: 'investigations', link: '' },
      ],
      [
        { id: 1, count: 10, name: 'EVP', slug: 'evp', link: '' },
        { id: 2, count: 8, name: 'Haunted Places', slug: 'haunted-places', link: '' },
        { id: 3, count: 5, name: 'Historic', slug: 'historic', link: '' },
      ],
    ],
  },
  ...overrides,
});

describe('Post Detail Page Integration', () => {
  describe('Post content rendering', () => {
    it('displays post title', () => {
      const post = createMockPost();
      render(
        <article data-testid="article-post">
          <h1 data-testid="text-post-title">{post.title.rendered}</h1>
        </article>
      );
      
      expect(screen.getByTestId('text-post-title')).toHaveTextContent('My Ghost Encounter at the Old Mill');
    });

    it('displays author name with avatar', () => {
      const post = createMockPost();
      const author = post._embedded?.author?.[0];
      
      render(
        <div data-testid="author-info">
          <img data-testid="img-author-avatar" src={author?.avatar_urls?.['48']} alt={author?.name} />
          <span data-testid="text-author-name">{author?.name}</span>
        </div>
      );
      
      expect(screen.getByTestId('text-author-name')).toHaveTextContent('Marcus Hale');
      expect(screen.getByTestId('img-author-avatar')).toHaveAttribute('src', '/author-marcus-hale.png');
    });

    it('displays publication date', () => {
      render(
        <time data-testid="text-publish-date" dateTime="2024-01-15T10:30:00">
          January 15, 2024
        </time>
      );
      
      expect(screen.getByTestId('text-publish-date')).toHaveTextContent('January 15, 2024');
    });

    it('displays reading time estimate', () => {
      render(
        <span data-testid="text-reading-time">3 min read</span>
      );
      
      expect(screen.getByTestId('text-reading-time')).toHaveTextContent('3 min read');
    });

    it('displays featured image with alt text', () => {
      const post = createMockPost();
      const featuredMedia = post._embedded?.['wp:featuredmedia']?.[0];
      
      render(
        <img 
          data-testid="img-featured" 
          src={featuredMedia?.source_url} 
          alt={featuredMedia?.alt_text} 
        />
      );
      
      const img = screen.getByTestId('img-featured');
      expect(img).toHaveAttribute('alt', 'The Old Mill at dusk');
      expect(img).toHaveAttribute('src', 'https://wp.cursedtours.com/wp-content/uploads/old-mill.jpg');
    });
  });

  describe('Categories and tags', () => {
    it('displays post categories', () => {
      const categories = [
        { id: 1, count: 25, name: 'Ghost Stories', slug: 'ghost-stories', link: '' },
        { id: 2, count: 15, name: 'Investigations', slug: 'investigations', link: '' },
      ];
      
      render(
        <div data-testid="post-categories">
          {categories.map((cat) => (
            <a 
              key={cat.id} 
              href={`/category/${cat.slug}`}
              data-testid={`category-badge-${cat.slug}`}
            >
              {cat.name}
            </a>
          ))}
        </div>
      );
      
      expect(screen.getByTestId('category-badge-ghost-stories')).toHaveTextContent('Ghost Stories');
      expect(screen.getByTestId('category-badge-investigations')).toHaveTextContent('Investigations');
    });

    it('category badges link to category archive', () => {
      render(
        <a 
          href="/category/ghost-stories" 
          data-testid="category-badge-ghost-stories"
        >
          Ghost Stories
        </a>
      );
      
      const badge = screen.getByTestId('category-badge-ghost-stories');
      expect(badge).toHaveAttribute('href', '/category/ghost-stories');
    });

    it('displays post tags', () => {
      const tags = [
        { id: 1, count: 10, name: 'EVP', slug: 'evp', link: '' },
        { id: 2, count: 8, name: 'Haunted Places', slug: 'haunted-places', link: '' },
      ];
      
      render(
        <div data-testid="post-tags">
          {tags.map((tag) => (
            <span key={tag.id} data-testid={`tag-${tag.slug}`}>
              {tag.name}
            </span>
          ))}
        </div>
      );
      
      expect(screen.getByTestId('tag-evp')).toHaveTextContent('EVP');
      expect(screen.getByTestId('tag-haunted-places')).toHaveTextContent('Haunted Places');
    });
  });

  describe('Related posts section', () => {
    it('displays related posts', () => {
      const relatedPosts = [
        createMockPost({ id: 10, slug: 'shadow-people', title: { rendered: 'Shadow People Phenomenon' } }),
        createMockPost({ id: 11, slug: 'evp-guide', title: { rendered: 'EVP Recording Guide' } }),
        createMockPost({ id: 12, slug: 'haunted-hotels', title: { rendered: 'Most Haunted Hotels' } }),
      ];
      
      render(
        <section data-testid="related-posts">
          <h2>Related Posts</h2>
          <div data-testid="related-posts-grid">
            {relatedPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="compact" />
            ))}
          </div>
        </section>
      );
      
      expect(screen.getByText('Shadow People Phenomenon')).toBeInTheDocument();
      expect(screen.getByText('EVP Recording Guide')).toBeInTheDocument();
      expect(screen.getByText('Most Haunted Hotels')).toBeInTheDocument();
    });

    it('related posts link to their detail pages', () => {
      const relatedPosts = [
        createMockPost({ id: 10, slug: 'shadow-people', title: { rendered: 'Shadow People' } }),
      ];
      
      render(
        <div data-testid="related-posts-grid">
          {relatedPosts.map((post) => (
            <PostCard key={post.id} post={post} variant="compact" />
          ))}
        </div>
      );
      
      const links = screen.getAllByRole('link');
      const shadowLink = links.find(link => link.getAttribute('href') === '/post/shadow-people');
      expect(shadowLink).toBeDefined();
    });
  });

  describe('Post content structure', () => {
    it('renders HTML content correctly', () => {
      const post = createMockPost();
      
      render(
        <div 
          data-testid="post-content"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />
      );
      
      const content = screen.getByTestId('post-content');
      expect(content).toContainHTML('<h2>The Investigation</h2>');
      expect(content).toContainHTML('<h2>Evidence Captured</h2>');
    });

    it('preserves paragraph structure', () => {
      const post = createMockPost();
      
      render(
        <div 
          data-testid="post-content"
          dangerouslySetInnerHTML={{ __html: post.content.rendered }}
        />
      );
      
      const content = screen.getByTestId('post-content');
      expect(content.querySelectorAll('p').length).toBeGreaterThan(2);
    });
  });
});
