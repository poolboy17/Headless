import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  stripHtml,
  formatDate,
  getReadingTime,
  getFeaturedImage,
  getAuthor,
  getCategories_Post,
  getTags_Post,
  buildSeo,
} from '@/lib/wordpress';
import type { WPPost, WPAuthor, WPMedia, WPCategory, WPTag, PostSeoFields } from '@/lib/wordpress';

describe('WordPress Utilities', () => {
  describe('stripHtml', () => {
    it('removes HTML tags from string', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      expect(stripHtml(html)).toBe('Hello World');
    });

    it('handles empty string', () => {
      expect(stripHtml('')).toBe('');
    });

    it('removes HTML entities', () => {
      const html = 'Hello&nbsp;World&amp;Test';
      expect(stripHtml(html)).toBe('Hello World Test');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string to readable format', () => {
      const result = formatDate('2024-01-15T10:30:00');
      expect(result).toContain('January');
      expect(result).toContain('15');
      expect(result).toContain('2024');
    });

    it('handles different date formats', () => {
      const result = formatDate('2023-12-25');
      expect(result).toContain('December');
      expect(result).toContain('25');
      expect(result).toContain('2023');
    });
  });

  describe('getReadingTime', () => {
    it('calculates reading time based on word count', () => {
      const content = Array(400).fill('word').join(' ');
      expect(getReadingTime(content)).toBe(2);
    });

    it('rounds up for partial minutes', () => {
      const content = Array(250).fill('word').join(' ');
      expect(getReadingTime(content)).toBe(2);
    });

    it('returns 1 for short content', () => {
      const content = 'short content';
      expect(getReadingTime(content)).toBe(1);
    });
  });

  describe('getAuthor', () => {
    it('returns author from embedded data', () => {
      const mockAuthor: WPAuthor = {
        id: 1,
        name: 'John Doe',
        slug: 'john-doe',
        link: 'https://example.com/author/john-doe',
      };

      const post = {
        _embedded: {
          author: [mockAuthor],
        },
      } as WPPost;

      expect(getAuthor(post)).toEqual(mockAuthor);
    });

    it('returns custom avatar for Marcus Hale', () => {
      const mockAuthor: WPAuthor = {
        id: 1,
        name: 'Marcus Hale',
        slug: 'marcus-hale',
        link: 'https://example.com/author/marcus-hale',
        avatar_urls: { '24': 'gravatar-url' },
      };

      const post = {
        _embedded: {
          author: [mockAuthor],
        },
      } as WPPost;

      const author = getAuthor(post);
      expect(author?.avatar_urls?.['24']).toBe('/author-marcus-hale.png');
      expect(author?.avatar_urls?.['48']).toBe('/author-marcus-hale.png');
      expect(author?.avatar_urls?.['96']).toBe('/author-marcus-hale.png');
    });

    it('returns undefined when no author embedded', () => {
      const post = {} as WPPost;
      expect(getAuthor(post)).toBeUndefined();
    });
  });

  describe('getFeaturedImage', () => {
    it('returns featured image data', () => {
      const mockMedia: WPMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        alt_text: 'Test image',
        media_details: {
          width: 1200,
          height: 800,
          sizes: {
            medium_large: {
              source_url: 'https://example.com/image-768x512.jpg',
              width: 768,
              height: 512,
            },
          },
        },
      };

      const post = {
        title: { rendered: 'Test Post' },
        _embedded: {
          'wp:featuredmedia': [mockMedia],
        },
      } as WPPost;

      const result = getFeaturedImage(post);
      expect(result).toEqual({
        url: 'https://example.com/image-768x512.jpg',
        width: 768,
        height: 512,
        alt: 'Test image',
      });
    });

    it('returns null when no featured media', () => {
      const post = { title: { rendered: 'Test' } } as WPPost;
      expect(getFeaturedImage(post)).toBeNull();
    });
  });

  describe('getCategories_Post', () => {
    it('extracts categories from embedded terms', () => {
      const mockCategories: WPCategory[] = [
        { id: 1, count: 10, name: 'Tech', slug: 'tech', link: '' },
        { id: 2, count: 5, name: 'News', slug: 'news', link: '' },
      ];

      const post = {
        _embedded: {
          'wp:term': [mockCategories, []],
        },
      } as WPPost;

      const result = getCategories_Post(post);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Tech');
    });

    it('returns empty array when no terms', () => {
      const post = {} as WPPost;
      expect(getCategories_Post(post)).toEqual([]);
    });
  });

  describe('getTags_Post', () => {
    it('extracts tags from embedded terms', () => {
      const mockTags: WPTag[] = [
        { id: 1, count: 3, name: 'JavaScript', slug: 'javascript', link: '' },
      ];

      const post = {
        _embedded: {
          'wp:term': [[], mockTags],
        },
      } as WPPost;

      const result = getTags_Post(post);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('JavaScript');
    });

    it('returns empty array when no tags', () => {
      const post = {} as WPPost;
      expect(getTags_Post(post)).toEqual([]);
    });
  });

  describe('buildSeo', () => {
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
      title: { rendered: 'Test Post Title' },
      content: { rendered: '<p>Test content</p>' },
      excerpt: { rendered: '<p>This is the test excerpt for the post.</p>' },
      author: 1,
      featured_media: 1,
      categories: [1],
      tags: [1],
      ...overrides,
    });

    it('uses post title when no SEO title provided', () => {
      const post = createMockPost();
      const seo = buildSeo(post);
      expect(seo.title).toBe('Test Post Title');
    });

    it('prefers seoTitle over post title', () => {
      const post = createMockPost();
      const seoFields: PostSeoFields = { seoTitle: 'Custom SEO Title' };
      const seo = buildSeo(post, seoFields);
      expect(seo.title).toBe('Custom SEO Title');
    });

    it('uses excerpt for description when no SEO description', () => {
      const post = createMockPost();
      const seo = buildSeo(post);
      expect(seo.description).toBe('This is the test excerpt for the post.');
    });

    it('prefers seoDescription over excerpt', () => {
      const post = createMockPost();
      const seoFields: PostSeoFields = { seoDescription: 'Custom meta description' };
      const seo = buildSeo(post, seoFields);
      expect(seo.description).toBe('Custom meta description');
    });

    it('truncates description to 160 characters', () => {
      const longExcerpt = 'A'.repeat(200);
      const post = createMockPost({ excerpt: { rendered: longExcerpt } });
      const seo = buildSeo(post);
      expect(seo.description.length).toBe(160);
    });

    it('generates canonical URL from slug', () => {
      const post = createMockPost({ slug: 'my-article' });
      const seo = buildSeo(post);
      expect(seo.canonical).toBe('https://cursedtours.com/post/my-article');
    });

    it('prefers canonicalUrl when provided', () => {
      const post = createMockPost();
      const seoFields: PostSeoFields = { canonicalUrl: 'https://custom.com/article' };
      const seo = buildSeo(post, seoFields);
      expect(seo.canonical).toBe('https://custom.com/article');
    });

    it('uses fallback chain for ogTitle: ogTitle -> seoTitle -> title', () => {
      const post = createMockPost();
      
      const seo1 = buildSeo(post);
      expect(seo1.ogTitle).toBe('Test Post Title');

      const seo2 = buildSeo(post, { seoTitle: 'SEO Title' });
      expect(seo2.ogTitle).toBe('SEO Title');

      const seo3 = buildSeo(post, { ogTitle: 'OG Title', seoTitle: 'SEO Title' });
      expect(seo3.ogTitle).toBe('OG Title');
    });

    it('uses fallback chain for ogDescription: ogDescription -> seoDescription -> excerpt', () => {
      const post = createMockPost();
      
      const seo1 = buildSeo(post);
      expect(seo1.ogDescription).toBe('This is the test excerpt for the post.');

      const seo2 = buildSeo(post, { seoDescription: 'SEO Desc' });
      expect(seo2.ogDescription).toBe('SEO Desc');

      const seo3 = buildSeo(post, { ogDescription: 'OG Desc', seoDescription: 'SEO Desc' });
      expect(seo3.ogDescription).toBe('OG Desc');
    });

    it('uses featured image for ogImage when available', () => {
      const mockMedia: WPMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        alt_text: 'Test image',
        media_details: {
          width: 1200,
          height: 800,
          sizes: {
            large: {
              source_url: 'https://example.com/image-large.jpg',
              width: 1024,
              height: 683,
            },
          },
        },
      };

      const post = createMockPost({
        _embedded: {
          'wp:featuredmedia': [mockMedia],
        },
      });

      const seo = buildSeo(post);
      expect(seo.ogImage).toBe('https://example.com/image-large.jpg');
    });

    it('uses default OG image when no featured image', () => {
      const post = createMockPost();
      const seo = buildSeo(post);
      expect(seo.ogImage).toBe('https://cursedtours.com/og-default.png');
    });

    it('prefers seoFields ogImage over featured image', () => {
      const mockMedia: WPMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
      };

      const post = createMockPost({
        _embedded: {
          'wp:featuredmedia': [mockMedia],
        },
      });

      const seoFields: PostSeoFields = {
        ogImage: { url: 'https://custom.com/og-image.jpg' },
      };

      const seo = buildSeo(post, seoFields);
      expect(seo.ogImage).toBe('https://custom.com/og-image.jpg');
    });

    it('uses featured image alt or title for altText', () => {
      const mockMedia: WPMedia = {
        id: 1,
        source_url: 'https://example.com/image.jpg',
        alt_text: 'Custom alt text',
      };

      const post = createMockPost({
        _embedded: {
          'wp:featuredmedia': [mockMedia],
        },
      });

      const seo = buildSeo(post);
      expect(seo.altText).toBe('Custom alt text');
    });

    it('falls back to title for altText when no image alt', () => {
      const post = createMockPost();
      const seo = buildSeo(post);
      expect(seo.altText).toBe('Test Post Title');
    });
  });
});
