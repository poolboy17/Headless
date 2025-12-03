import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  stripHtml,
  formatDate,
  getReadingTime,
  getFeaturedImage,
  getAuthor,
  getCategories_Post,
  getTags_Post,
} from '@/lib/wordpress';
import type { WPPost, WPAuthor, WPMedia, WPCategory, WPTag } from '@/lib/wordpress';

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
});
