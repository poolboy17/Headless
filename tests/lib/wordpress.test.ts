import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  stripHtml,
  formatDate,
  getReadingTime,
  getFeaturedImage,
  getAuthor,
  getCategories_Post,
  getTags_Post,
  buildSeo,
  getPosts,
  getPost,
  getCategories,
  getCategoryBySlug,
  getAllPostSlugs,
  getAllCategorySlugs,
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

    it('handles empty excerpt gracefully', () => {
      const post = createMockPost({ excerpt: { rendered: '' } });
      const seo = buildSeo(post);
      expect(seo.description).toBe('');
    });

    it('handles missing excerpt object', () => {
      const post = createMockPost({ excerpt: undefined });
      const seo = buildSeo(post);
      expect(seo.description).toBe('');
    });

    it('returns default OG image URL format', () => {
      const post = createMockPost();
      const seo = buildSeo(post);
      expect(seo.ogImage).toContain('og-default.png');
    });
  });
});

describe('Data Fetching Functions', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('getPosts', () => {
    it('fetches posts with default parameters', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Test Post' } }];
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPosts),
        headers: new Headers({
          'X-WP-TotalPages': '5',
          'X-WP-Total': '50',
        }),
      } as Response);

      const result = await getPosts();
      
      expect(result.posts).toEqual(mockPosts);
      expect(result.totalPages).toBe(5);
      expect(result.totalPosts).toBe(50);
    });

    it('throws error on API failure', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(getPosts()).rejects.toThrow('WordPress API error: 500');
    });

    it('handles missing pagination headers', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: new Headers({}),
      } as Response);

      const result = await getPosts();
      expect(result.totalPages).toBe(1);
      expect(result.totalPosts).toBe(0);
    });

    it('fetches posts by category slug', async () => {
      const mockCategories = [{ id: 5, slug: 'ghost-stories' }];
      const mockPosts = [{ id: 1, title: { rendered: 'Ghost Story' } }];
      
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPosts),
          headers: new Headers({ 'X-WP-TotalPages': '1', 'X-WP-Total': '1' }),
        } as Response);

      const result = await getPosts({ category: 'ghost-stories' });
      expect(result.posts).toEqual(mockPosts);
    });

    it('fetches posts by search query', async () => {
      const mockPosts = [{ id: 1, title: { rendered: 'Haunted House' } }];
      
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPosts),
        headers: new Headers({ 'X-WP-TotalPages': '1', 'X-WP-Total': '1' }),
      } as Response);

      const result = await getPosts({ search: 'haunted' });
      expect(result.posts).toEqual(mockPosts);
    });
  });

  describe('getPost', () => {
    it('fetches single post by slug', async () => {
      const mockPost = { id: 1, slug: 'test-post', categories: [1] };
      const mockRelated = [{ id: 2, slug: 'related-post' }];
      
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockPost]),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockRelated),
        } as Response);

      const result = await getPost('test-post');
      expect(result.post).toEqual(mockPost);
      expect(result.relatedPosts).toEqual(mockRelated);
    });

    it('throws error when post not found', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      await expect(getPost('nonexistent')).rejects.toThrow('Post not found');
    });

    it('throws error on API failure', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      await expect(getPost('test')).rejects.toThrow('WordPress API error: 404');
    });

    it('handles post without categories gracefully', async () => {
      const mockPost = { id: 1, slug: 'test-post', categories: [] };
      
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockPost]),
      } as Response);

      const result = await getPost('test-post');
      expect(result.relatedPosts).toEqual([]);
    });

    it('handles failed related posts fetch gracefully', async () => {
      const mockPost = { id: 1, slug: 'test-post', categories: [1] };
      
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockPost]),
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        } as Response);

      const result = await getPost('test-post');
      expect(result.relatedPosts).toEqual([]);
    });
  });

  describe('getCategories', () => {
    it('fetches all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Ghost Stories', slug: 'ghost-stories' },
        { id: 2, name: 'Investigations', slug: 'investigations' },
      ];
      
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response);

      const result = await getCategories();
      expect(result).toEqual(mockCategories);
    });

    it('throws error on API failure', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as Response);

      await expect(getCategories()).rejects.toThrow('WordPress API error: 503');
    });
  });

  describe('getCategoryBySlug', () => {
    it('returns category when found', async () => {
      const mockCategory = { id: 1, name: 'Ghost Stories', slug: 'ghost-stories' };
      
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([mockCategory]),
      } as Response);

      const result = await getCategoryBySlug('ghost-stories');
      expect(result).toEqual(mockCategory);
    });

    it('returns null when category not found', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      const result = await getCategoryBySlug('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getAllPostSlugs', () => {
    it('fetches all post slugs across pages', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ slug: 'post-1' }, { slug: 'post-2' }]),
          headers: new Headers({ 'X-WP-TotalPages': '2' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([{ slug: 'post-3' }]),
          headers: new Headers({ 'X-WP-TotalPages': '2' }),
        } as Response);

      const result = await getAllPostSlugs();
      expect(result).toEqual(['post-1', 'post-2', 'post-3']);
    });

    it('stops on API failure', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const result = await getAllPostSlugs();
      expect(result).toEqual([]);
    });

    it('stops when receiving empty response', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
        headers: new Headers({ 'X-WP-TotalPages': '1' }),
      } as Response);

      const result = await getAllPostSlugs();
      expect(result).toEqual([]);
    });
  });

  describe('getAllCategorySlugs', () => {
    it('fetches all category slugs', async () => {
      const mockCategories = [
        { slug: 'ghost-stories' },
        { slug: 'investigations' },
      ];
      
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response);

      const result = await getAllCategorySlugs();
      expect(result).toEqual(['ghost-stories', 'investigations']);
    });
  });
});
