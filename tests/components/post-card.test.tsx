import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PostCard } from '@/components/post-card';
import type { WPPost, WPAuthor, WPMedia, WPCategory } from '@/lib/wordpress';

const createMockPost = (overrides = {}): WPPost => ({
  id: 1,
  date: '2024-01-15T10:30:00',
  date_gmt: '2024-01-15T10:30:00',
  modified: '2024-01-15T10:30:00',
  modified_gmt: '2024-01-15T10:30:00',
  slug: 'test-post',
  status: 'publish',
  type: 'post',
  link: 'https://example.com/test-post',
  title: { rendered: 'Test Post Title' },
  content: { rendered: '<p>This is test content for reading time calculation.</p>' },
  excerpt: { rendered: '<p>This is a test excerpt</p>' },
  author: 1,
  featured_media: 1,
  categories: [1],
  tags: [1],
  _embedded: {
    author: [{
      id: 1,
      name: 'John Doe',
      slug: 'john-doe',
      link: 'https://example.com/author/john-doe',
      avatar_urls: { '24': 'https://example.com/avatar.jpg' },
    }],
    'wp:featuredmedia': [{
      id: 1,
      source_url: 'https://example.com/image.jpg',
      alt_text: 'Featured image',
      media_details: {
        width: 1200,
        height: 800,
        sizes: {
          medium_large: {
            source_url: 'https://example.com/image-768.jpg',
            width: 768,
            height: 512,
          },
        },
      },
    }],
    'wp:term': [[{
      id: 1,
      count: 10,
      name: 'Technology',
      slug: 'technology',
      link: 'https://example.com/category/technology',
    }], []],
  },
  ...overrides,
});

describe('PostCard Component', () => {
  describe('default variant', () => {
    it('renders post title', () => {
      render(<PostCard post={createMockPost()} />);
      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    });

    it('renders author name', () => {
      render(<PostCard post={createMockPost()} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders category badge', () => {
      render(<PostCard post={createMockPost()} />);
      expect(screen.getByText('Technology')).toBeInTheDocument();
    });

    it('renders formatted date', () => {
      render(<PostCard post={createMockPost()} />);
      expect(screen.getByText(/January/)).toBeInTheDocument();
    });

    it('renders reading time', () => {
      render(<PostCard post={createMockPost()} />);
      expect(screen.getByText(/min/)).toBeInTheDocument();
    });

    it('renders excerpt', () => {
      render(<PostCard post={createMockPost()} />);
      expect(screen.getByText(/This is a test excerpt/)).toBeInTheDocument();
    });

    it('has correct link to post', () => {
      render(<PostCard post={createMockPost()} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/post/test-post');
    });

    it('has test id for post card', () => {
      render(<PostCard post={createMockPost()} />);
      expect(screen.getByTestId('card-post-test-post')).toBeInTheDocument();
    });
  });

  describe('featured variant', () => {
    it('renders post title', () => {
      render(<PostCard post={createMockPost()} variant="featured" />);
      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    });

    it('renders author avatar', () => {
      render(<PostCard post={createMockPost()} variant="featured" />);
      const avatar = screen.getByRole('img', { hidden: true });
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('compact variant', () => {
    it('renders post title', () => {
      render(<PostCard post={createMockPost()} variant="compact" />);
      expect(screen.getByText('Test Post Title')).toBeInTheDocument();
    });

    it('renders date', () => {
      render(<PostCard post={createMockPost()} variant="compact" />);
      expect(screen.getByText(/January/)).toBeInTheDocument();
    });

    it('does not render excerpt in compact mode', () => {
      render(<PostCard post={createMockPost()} variant="compact" />);
      expect(screen.queryByText(/This is a test excerpt/)).not.toBeInTheDocument();
    });
  });

  describe('without featured image', () => {
    it('renders placeholder when no featured media', () => {
      const postWithoutImage = createMockPost({
        _embedded: {
          ...createMockPost()._embedded,
          'wp:featuredmedia': undefined,
        },
      });
      render(<PostCard post={postWithoutImage} />);
      expect(screen.getByText('No image')).toBeInTheDocument();
    });
  });
});
