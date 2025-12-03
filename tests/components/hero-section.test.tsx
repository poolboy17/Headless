import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/hero-section';
import type { WPPost, WPCategory } from '@/lib/wordpress';

const createMockPost = (overrides = {}): WPPost => ({
  id: 1,
  date: '2024-01-15T10:30:00',
  date_gmt: '2024-01-15T10:30:00',
  modified: '2024-01-15T10:30:00',
  modified_gmt: '2024-01-15T10:30:00',
  slug: 'haunted-mansion-investigation',
  status: 'publish',
  type: 'post',
  link: 'https://cursedtours.com/haunted-mansion-investigation',
  title: { rendered: 'Haunted Mansion Investigation' },
  content: { rendered: '<p>A thrilling investigation of the haunted mansion with detailed findings and paranormal evidence.</p>' },
  excerpt: { rendered: '<p>Join us as we explore the haunted mansion</p>' },
  author: 1,
  featured_media: 1,
  categories: [1],
  tags: [1],
  _embedded: {
    author: [{
      id: 1,
      name: 'Marcus Hale',
      slug: 'marcus-hale',
      link: 'https://cursedtours.com/author/marcus-hale',
      avatar_urls: { '48': '/author-marcus-hale.png' },
    }],
    'wp:featuredmedia': [{
      id: 1,
      source_url: 'https://cursedtours.com/wp-content/uploads/hero.jpg',
      alt_text: 'Haunted mansion at night',
      media_details: {
        width: 1200,
        height: 800,
        sizes: {
          medium_large: {
            source_url: 'https://cursedtours.com/wp-content/uploads/hero-768.jpg',
            width: 768,
            height: 512,
          },
        },
      },
    }],
    'wp:term': [[{
      id: 1,
      count: 25,
      name: 'Ghost Stories',
      slug: 'ghost-stories',
      link: 'https://cursedtours.com/category/ghost-stories',
    } as WPCategory], []],
  },
  ...overrides,
});

describe('HeroSection Component', () => {
  it('renders the post title', () => {
    render(<HeroSection post={createMockPost()} />);
    expect(screen.getByTestId('hero-title')).toHaveTextContent('Haunted Mansion Investigation');
  });

  it('renders the hero title with correct link', () => {
    render(<HeroSection post={createMockPost()} />);
    const titleLink = screen.getByTestId('hero-title').querySelector('a');
    expect(titleLink).toHaveAttribute('href', '/post/haunted-mansion-investigation');
  });

  it('renders the author name', () => {
    render(<HeroSection post={createMockPost()} />);
    expect(screen.getByText('Marcus Hale')).toBeInTheDocument();
  });

  it('renders the formatted date', () => {
    render(<HeroSection post={createMockPost()} />);
    expect(screen.getByText(/January/)).toBeInTheDocument();
    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('renders reading time', () => {
    render(<HeroSection post={createMockPost()} />);
    expect(screen.getByText(/min read/)).toBeInTheDocument();
  });

  it('renders category badges', () => {
    render(<HeroSection post={createMockPost()} />);
    expect(screen.getByText('Ghost Stories')).toBeInTheDocument();
  });

  it('renders category badge with correct link', () => {
    render(<HeroSection post={createMockPost()} />);
    const categoryBadge = screen.getByTestId('hero-badge-category-1');
    expect(categoryBadge.closest('a')).toHaveAttribute('href', '/category/ghost-stories');
  });

  it('renders the Read More CTA button', () => {
    render(<HeroSection post={createMockPost()} />);
    const cta = screen.getByTestId('hero-cta');
    expect(cta).toBeInTheDocument();
    expect(cta.closest('a')).toHaveAttribute('href', '/post/haunted-mansion-investigation');
  });

  it('does not render categories when none exist', () => {
    const postWithoutCategories = createMockPost({
      _embedded: {
        ...createMockPost()._embedded,
        'wp:term': [[], []],
      },
    });
    render(<HeroSection post={postWithoutCategories} />);
    expect(screen.queryByTestId('hero-badge-category-1')).not.toBeInTheDocument();
  });

  it('does not render author section when no author embedded', () => {
    const postWithoutAuthor = createMockPost({
      _embedded: {
        ...createMockPost()._embedded,
        author: undefined,
      },
    });
    render(<HeroSection post={postWithoutAuthor} />);
    expect(screen.queryByText('Marcus Hale')).not.toBeInTheDocument();
  });

  it('limits category badges to 2', () => {
    const postWithManyCategories = createMockPost({
      _embedded: {
        ...createMockPost()._embedded,
        'wp:term': [[
          { id: 1, count: 25, name: 'Ghost Stories', slug: 'ghost-stories', link: '' },
          { id: 2, count: 15, name: 'Investigations', slug: 'investigations', link: '' },
          { id: 3, count: 10, name: 'Paranormal', slug: 'paranormal', link: '' },
        ] as WPCategory[], []],
      },
    });
    render(<HeroSection post={postWithManyCategories} />);
    expect(screen.getByText('Ghost Stories')).toBeInTheDocument();
    expect(screen.getByText('Investigations')).toBeInTheDocument();
    expect(screen.queryByText('Paranormal')).not.toBeInTheDocument();
  });

  it('renders hero image', () => {
    render(<HeroSection post={createMockPost()} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'CURSED TOURS - Some boundaries aren\'t meant to be crossed');
  });
});
