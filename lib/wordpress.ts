// Ensure we always have a valid URL - fallback to production URL if env var is missing or invalid
function getWordPressBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const fallbackUrl = 'https://wp.cursedtours.com';

  if (!envUrl) {
    return fallbackUrl;
  }

  // Validate that it's a proper URL
  try {
    new URL(envUrl);
    return envUrl;
  } catch {
    console.warn(`Invalid NEXT_PUBLIC_WORDPRESS_URL: ${envUrl}, using fallback`);
    return fallbackUrl;
  }
}

const WP_BASE_URL = getWordPressBaseUrl();
const WP_API_URL = `${WP_BASE_URL}/wp-json/wp/v2`;

// Transform image URLs from old domain to wp subdomain
function transformImageUrl(url: string): string {
  if (!url) return url;
  return url.replace(
    /https?:\/\/(www\.)?cursedtours\.com\/wp-content\/uploads/g,
    'https://wp.cursedtours.com/wp-content/uploads'
  );
}

export interface WPMedia {
  id: number;
  source_url: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, {
      source_url: string;
      width: number;
      height: number;
    }>;
  };
}

export interface WPCategory {
  id: number;
  count: number;
  name: string;
  slug: string;
  description?: string;
  link: string;
}

export interface WPTag {
  id: number;
  count: number;
  name: string;
  slug: string;
  link: string;
}

export interface WPAuthor {
  id: number;
  name: string;
  slug: string;
  description?: string;
  avatar_urls?: Record<string, string>;
  link: string;
}

export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected?: boolean };
  excerpt: { rendered: string; protected?: boolean };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    author?: WPAuthor[];
    'wp:featuredmedia'?: WPMedia[];
    'wp:term'?: (WPCategory | WPTag)[][];
  };
}

export interface PostsResponse {
  posts: WPPost[];
  totalPages: number;
  totalPosts: number;
}

export interface SinglePostResponse {
  post: WPPost;
  relatedPosts: WPPost[];
}

export const DEFAULT_REVALIDATE = 300;

interface FetchOptions {
  revalidate?: number | false;
  tags?: string[];
}

async function fetchWP<T>(endpoint: string, options: FetchOptions = {}, defaultValue: T): Promise<T> {
  try {
    const { revalidate = DEFAULT_REVALIDATE, tags } = options;

    const fetchOptions: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
      next: {},
    };

    if (revalidate !== false) {
      fetchOptions.next!.revalidate = revalidate;
    }

    if (tags?.length) {
      fetchOptions.next!.tags = tags;
    }

    const response = await fetch(`${WP_API_URL}${endpoint}`, fetchOptions);

    if (!response.ok) {
      console.warn(`WordPress API error: ${response.status}`);
      return defaultValue;
    }

    return response.json();
  } catch (error) {
    console.warn('WordPress API fetch failed:', error);
    return defaultValue;
  }
}

export async function getPosts(params: {
  page?: number;
  perPage?: number;
  category?: string;
  tag?: string;
  search?: string;
} = {}): Promise<PostsResponse> {
  try {
    const { page = 1, perPage = 10, category, tag, search } = params;

    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      _embed: 'true',
    });

    if (category) {
      const catResponse = await fetch(
        `${WP_API_URL}/categories?slug=${category}`,
        { next: { revalidate: 300 } }
      );
      if (catResponse.ok) {
        const categories = await catResponse.json();
        if (categories.length > 0) {
          queryParams.append('categories', categories[0].id.toString());
        }
      }
    }

    if (tag) {
      const tagResponse = await fetch(
        `${WP_API_URL}/tags?slug=${tag}`,
        { next: { revalidate: 300 } }
      );
      if (tagResponse.ok) {
        const tags = await tagResponse.json();
        if (tags.length > 0) {
          queryParams.append('tags', tags[0].id.toString());
        }
      }
    }

    if (search) {
      queryParams.append('search', search);
    }

    const response = await fetch(`${WP_API_URL}/posts?${queryParams}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.warn(`WordPress API error: ${response.status}`);
      return { posts: [], totalPages: 0, totalPosts: 0 };
    }

    const posts = await response.json();
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
    const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');

    return { posts, totalPages, totalPosts };
  } catch (error) {
    console.warn('WordPress API fetch failed:', error);
    return { posts: [], totalPages: 0, totalPosts: 0 };
  }
}

export async function getPost(slug: string): Promise<SinglePostResponse> {
  const response = await fetch(
    `${WP_API_URL}/posts?slug=${slug}&_embed=true`,
    { next: { revalidate: 300 } }
  );
  
  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }
  
  const posts = await response.json();
  
  if (posts.length === 0) {
    throw new Error('Post not found');
  }
  
  const post = posts[0];
  
  let relatedPosts: WPPost[] = [];
  if (post.categories?.length > 0) {
    const relatedResponse = await fetch(
      `${WP_API_URL}/posts?categories=${post.categories[0]}&exclude=${post.id}&per_page=4&_embed=true`,
      { next: { revalidate: 300 } }
    );
    if (relatedResponse.ok) {
      relatedPosts = await relatedResponse.json();
    }
  }
  
  return { post, relatedPosts };
}

export async function getCategories(): Promise<WPCategory[]> {
  return fetchWP<WPCategory[]>('/categories?per_page=100&orderby=count&order=desc', {
    tags: ['categories'],
  }, []);
}

export async function getTags(): Promise<WPTag[]> {
  return fetchWP<WPTag[]>('/tags?per_page=100&orderby=count&order=desc', {
    tags: ['tags'],
  }, []);
}

export async function getCategoryBySlug(slug: string): Promise<WPCategory | null> {
  const categories = await fetchWP<WPCategory[]>(`/categories?slug=${slug}`, {
    tags: ['categories'],
  }, []);
  return categories.length > 0 ? categories[0] : null;
}

export async function getAllPostSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    const response = await fetch(`${WP_API_URL}/posts?per_page=${perPage}&page=${page}&_fields=slug`, {
      next: { revalidate: 3600 },
    });
    
    if (!response.ok) break;
    
    const posts: { slug: string }[] = await response.json();
    if (posts.length === 0) break;
    
    slugs.push(...posts.map(p => p.slug));
    
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
    if (page >= totalPages) break;
    page++;
  }
  
  return slugs;
}

export async function getAllCategorySlugs(): Promise<string[]> {
  const categories = await fetchWP<WPCategory[]>('/categories?per_page=100&_fields=slug', {
    revalidate: 3600,
    tags: ['categories'],
  }, []);
  return categories.map(c => c.slug);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getReadingTime(content: string): number {
  const text = stripHtml(content);
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function getFeaturedImage(post: WPPost, size: 'medium' | 'medium_large' | 'large' = 'medium_large') {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media) return null;
  
  const sizes = media.media_details?.sizes;
  const selectedSize = sizes?.[size] || sizes?.large || sizes?.medium_large;
  
  return {
    url: transformImageUrl(selectedSize?.source_url || media.source_url),
    width: selectedSize?.width || media.media_details?.width || 800,
    height: selectedSize?.height || media.media_details?.height || 600,
    alt: media.alt_text || stripHtml(post.title.rendered),
  };
}

const AUTHOR_AVATARS: Record<string, string> = {
  'marcus-hale': '/author-marcus-hale.png',
  'marcus hale': '/author-marcus-hale.png',
};

export function getAuthor(post: WPPost) {
  const author = post._embedded?.author?.[0];
  if (!author) return undefined;
  
  const authorSlug = author.slug?.toLowerCase() || author.name?.toLowerCase() || '';
  const customAvatar = AUTHOR_AVATARS[authorSlug];
  
  if (customAvatar) {
    return {
      ...author,
      avatar_urls: {
        '24': customAvatar,
        '48': customAvatar,
        '96': customAvatar,
      },
    };
  }
  
  return author;
}

export function getCategories_Post(post: WPPost): WPCategory[] {
  const terms = post._embedded?.['wp:term']?.[0];
  if (!Array.isArray(terms)) return [];
  return terms.filter((t): t is WPCategory => 'count' in t);
}

export function getTags_Post(post: WPPost): WPTag[] {
  const terms = post._embedded?.['wp:term']?.[1];
  if (!Array.isArray(terms)) return [];
  return terms.filter((t): t is WPTag => 'count' in t);
}

// WordPress Pages
export interface WPPage {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string; protected?: boolean };
  excerpt: { rendered: string; protected?: boolean };
  author: number;
  featured_media: number;
  parent: number;
  menu_order: number;
  _embedded?: {
    author?: WPAuthor[];
    'wp:featuredmedia'?: WPMedia[];
  };
}

export async function getPage(slug: string): Promise<WPPage | null> {
  try {
    const response = await fetch(
      `${WP_API_URL}/pages?slug=${slug}&_embed=true`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      console.warn(`WordPress API error: ${response.status}`);
      return null;
    }

    const pages = await response.json();
    return pages.length > 0 ? pages[0] : null;
  } catch (error) {
    console.warn('WordPress API fetch failed:', error);
    return null;
  }
}

export async function getPages(): Promise<WPPage[]> {
  return fetchWP<WPPage[]>('/pages?per_page=100&_embed=true', {
    tags: ['pages'],
  }, []);
}

export async function getAllPageSlugs(): Promise<string[]> {
  const pages = await fetchWP<WPPage[]>('/pages?per_page=100&_fields=slug', {
    revalidate: 3600,
    tags: ['pages'],
  }, []);
  return pages.map(p => p.slug);
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cursedtours.com';
const DEFAULT_OG_IMAGE_URL = `${SITE_URL}/og-default.png`;

export interface SeoData {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  altText: string;
}

export interface PostSeoFields {
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: { url: string };
  featuredImageAlt?: string;
}

export function buildSeo(post: WPPost, seoFields?: PostSeoFields): SeoData {
  const title = stripHtml(post.title.rendered);
  const excerpt = stripHtml(post.excerpt?.rendered || '');
  const featuredImage = getFeaturedImage(post, 'large');

  return {
    title: seoFields?.seoTitle || title,
    description: seoFields?.seoDescription || excerpt.slice(0, 160),
    canonical: seoFields?.canonicalUrl || `${SITE_URL}/post/${post.slug}`,
    ogTitle: seoFields?.ogTitle || seoFields?.seoTitle || title,
    ogDescription: seoFields?.ogDescription || seoFields?.seoDescription || excerpt,
    ogImage: seoFields?.ogImage?.url || featuredImage?.url || DEFAULT_OG_IMAGE_URL,
    altText: seoFields?.featuredImageAlt || featuredImage?.alt || title,
  };
}
