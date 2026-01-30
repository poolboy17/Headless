// Ensure we always have a valid URL - fallback to production URL if env var is missing or invalid
function getWordPressBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  const fallbackUrl = 'https://wp.cursedtours.com';

  if (!envUrl) {
    return fallbackUrl;
  }

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cursedtours.com';

function transformImageUrl(url: string): string {
  if (!url) return url;
  return url.replace(
    /https?:\/\/(www\.)?cursedtours\.com\/wp-content\/uploads/g,
    'https://wp.cursedtours.com/wp-content/uploads'
  );
}

const VALID_NON_POST_PATHS = [
  'about-us', 'contact-us', 'privacy-policy', 'terms-of-service',
  'cookie-policy', 'affiliate-disclosure', 'category', 'tag', 'search', 'api',
];

/**
 * Aggressively fix corrupted HTML content
 * Handles multiple levels of encoding corruption
 */
function transformPostContent(content: string): string {
  if (!content) return content;

  let transformed = content;

  // STEP 1: Remove deeply nested broken link structures FIRST
  // These are unfixable - pattern like: &lt;a href="url-&lt;a href="url">text</a>-more"&gt;
  // Remove them entirely to prevent visible garbage
  
  // Pattern 1: Encoded opening tag containing another link
  transformed = transformed.replace(
    /&lt;a\s+href=["&quot;][^"]*?<a\s+href=[^>]+>[^<]*<\/a>[^"]*?["&quot;]&gt;/gi,
    ''
  );
  
  // Pattern 2: Encoded opening tag with encoded content inside
  transformed = transformed.replace(
    /&lt;a\s+href=["&quot;][^"]*?&lt;a\s+href=[^&]*?&gt;[^&]*?&lt;\/a&gt;[^"]*?["&quot;]&gt;/gi,
    ''
  );

  // Pattern 3: Mixed encoding - starts with &lt; but has real quotes
  transformed = transformed.replace(
    /&lt;a\s+href="[^"]*?(?:&lt;|<)a\s+href=[^>]*>[^<]*<\/a>[^"]*"&gt;/gi,
    ''
  );
  
  // Pattern 4: Any &lt;a href= followed by complex nested garbage until &gt;
  transformed = transformed.replace(
    /&lt;a\s+href=["&quot;]https?:\/\/cursedtours\.com\/[^"&]*(?:&lt;|<)a[^&>]*(?:&gt;|>)[^&]*(?:&lt;|<)\/a(?:&gt;|>)[^"&]*["&quot;]&gt;/gi,
    ''
  );

  // STEP 2: Decode HTML entities iteratively
  let previousContent = '';
  let iterations = 0;
  
  while (transformed !== previousContent && iterations < 10) {
    previousContent = transformed;
    iterations++;
    
    // Decode &lt; &gt; for anchor tags (with both &quot; and regular quotes)
    transformed = transformed
      .replace(/&lt;a\s+href=&quot;([^&]+)&quot;&gt;/gi, '<a href="$1">')
      .replace(/&lt;a\s+href=&quot;([^&]+)&quot;\s*&gt;/gi, '<a href="$1">')
      .replace(/&lt;a\s+href="([^"]+)"&gt;/gi, '<a href="$1">')
      .replace(/&lt;a\s+href="([^"]+)"\s*&gt;/gi, '<a href="$1">')
      .replace(/&lt;\/a&gt;/gi, '</a>')
      .replace(/&lt;(\/?)(strong|em|b|i|p|span|div)&gt;/gi, '<$1$2>')
      .replace(/href=&quot;([^"&]+)&quot;/gi, 'href="$1"')
      .replace(/&#8221;/g, '"')
      .replace(/&#8220;/g, '"')
      .replace(/&#8217;/g, "'")
      .replace(/&#8216;/g, "'");
  }

  // STEP 3: Clean up any remaining broken structures
  // Remove any remaining &lt;a that didn't get cleaned
  transformed = transformed.replace(/&lt;a\s+href=[^&]*&gt;/gi, '');
  transformed = transformed.replace(/&lt;\/a&gt;/gi, '');

  // STEP 4: Fix internal links to use /post/ prefix
  const validPathsPattern = VALID_NON_POST_PATHS.join('|');
  
  transformed = transformed.replace(
    new RegExp(
      `href="https?://(www\\.)?cursedtours\\.com/(?!(${validPathsPattern}|post|wp-content|wp-admin|wp-includes)/)([a-z0-9-]+)/?"`,
      'gi'
    ),
    `href="${SITE_URL}/post/$3"`
  );

  transformed = transformed.replace(
    /href="https?:\/\/(www\.)?cursedtours\.com\/post\/([a-z0-9-]+)\/?"/gi,
    `href="${SITE_URL}/post/$2"`
  );

  transformed = transformed.replace(
    /href="https?:\/\/(www\.)?cursedtours\.com\/category\/([a-z0-9-]+)\/?"/gi,
    `href="${SITE_URL}/category/$2"`
  );

  // Fix relative /articles/ links - remove /articles/ prefix
  transformed = transformed.replace(
    /href="\/articles\/([a-z0-9-]+)\/?"/gi,
    'href="/$1/"'
  );

  // STEP 5: Transform image URLs
  transformed = transformed.replace(
    /https?:\/\/(www\.)?cursedtours\.com\/wp-content\/uploads/g,
    'https://wp.cursedtours.com/wp-content/uploads'
  );

  return transformed;
}

export interface WPMedia {
  id: number;
  source_url: string;
  alt_text?: string;
  media_details?: {
    width?: number;
    height?: number;
    sizes?: Record<string, { source_url: string; width: number; height: number; }>;
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

export interface ViatorTour {
  productCode: string;
  title: string;
  url: string;
  price: string;
  rating: number;
  reviewCount: number;
  thumbnailUrl?: string;
  destination?: string;
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
  meta?: {
    viator_tour?: ViatorTour;
    [key: string]: unknown;
  };
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
    const fetchOptions: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = { next: {} };
    if (revalidate !== false) fetchOptions.next!.revalidate = revalidate;
    if (tags?.length) fetchOptions.next!.tags = tags;
    const response = await fetch(`${WP_API_URL}${endpoint}`, fetchOptions);
    if (!response.ok) { console.warn(`WordPress API error: ${response.status}`); return defaultValue; }
    return response.json();
  } catch (error) {
    console.warn('WordPress API fetch failed:', error);
    return defaultValue;
  }
}

function transformPost(post: WPPost): WPPost {
  return {
    ...post,
    content: { ...post.content, rendered: transformPostContent(post.content.rendered) },
    excerpt: { ...post.excerpt, rendered: transformPostContent(post.excerpt.rendered) },
  };
}

export async function getPosts(params: { page?: number; perPage?: number; category?: string; tag?: string; search?: string; } = {}): Promise<PostsResponse> {
  try {
    const { page = 1, perPage = 10, category, tag, search } = params;
    const queryParams = new URLSearchParams({ page: page.toString(), per_page: perPage.toString(), _embed: 'true' });

    if (category) {
      const catResponse = await fetch(`${WP_API_URL}/categories?slug=${category}`, { next: { revalidate: 300 } });
      if (catResponse.ok) {
        const categories = await catResponse.json();
        if (categories.length > 0) queryParams.append('categories', categories[0].id.toString());
      }
    }

    if (tag) {
      const tagResponse = await fetch(`${WP_API_URL}/tags?slug=${tag}`, { next: { revalidate: 300 } });
      if (tagResponse.ok) {
        const tags = await tagResponse.json();
        if (tags.length > 0) queryParams.append('tags', tags[0].id.toString());
      }
    }

    if (search) queryParams.append('search', search);

    const response = await fetch(`${WP_API_URL}/posts?${queryParams}`, { next: { revalidate: 300, tags: ['posts'] } });
    if (!response.ok) { console.warn(`WordPress API error: ${response.status}`); return { posts: [], totalPages: 0, totalPosts: 0 }; }

    const posts: WPPost[] = await response.json();
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
    const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');

    return { posts: posts.map(transformPost), totalPages, totalPosts };
  } catch (error) {
    console.warn('WordPress API fetch failed:', error);
    return { posts: [], totalPages: 0, totalPosts: 0 };
  }
}

export async function getPost(slug: string): Promise<SinglePostResponse> {
  const response = await fetch(`${WP_API_URL}/posts?slug=${slug}&_embed=true`, { next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`WordPress API error: ${response.status}`);
  
  const posts: WPPost[] = await response.json();
  if (posts.length === 0) throw new Error('Post not found');
  
  const post = transformPost(posts[0]);
  
  let relatedPosts: WPPost[] = [];
  if (post.categories?.length > 0) {
    const relatedResponse = await fetch(`${WP_API_URL}/posts?categories=${post.categories[0]}&exclude=${post.id}&per_page=4&_embed=true`, { next: { revalidate: 300 } });
    if (relatedResponse.ok) {
      const rawRelated: WPPost[] = await relatedResponse.json();
      relatedPosts = rawRelated.map(transformPost);
    }
  }
  
  return { post, relatedPosts };
}

export async function getCategories(): Promise<WPCategory[]> {
  return fetchWP<WPCategory[]>('/categories?per_page=100&orderby=count&order=desc', { tags: ['categories'] }, []);
}

export async function getTags(): Promise<WPTag[]> {
  return fetchWP<WPTag[]>('/tags?per_page=100&orderby=count&order=desc', { tags: ['tags'] }, []);
}

export async function getCategoryBySlug(slug: string): Promise<WPCategory | null> {
  const categories = await fetchWP<WPCategory[]>(`/categories?slug=${slug}`, { tags: ['categories'] }, []);
  return categories.length > 0 ? categories[0] : null;
}

export async function getAllPostSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    const response = await fetch(`${WP_API_URL}/posts?per_page=${perPage}&page=${page}&_fields=slug`, { next: { revalidate: 3600 } });
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
  const categories = await fetchWP<WPCategory[]>('/categories?per_page=100&_fields=slug', { revalidate: 3600, tags: ['categories'] }, []);
  return categories.map(c => c.slug);
}

export function stripHtml(html: string): string {
  const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&#8217;': "'",
    '&#8216;': "'",
    '&#8220;': '"',
    '&#8221;': '"',
    '&#8211;': '–',
    '&#8212;': '—',
    '&nbsp;': ' ',
    '&hellip;': '...',
    '&#8230;': '...',
    '&ndash;': '–',
    '&mdash;': '—',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
  };
  
  let text = html.replace(/<[^>]*>/g, '');
  
  for (const [entity, char] of Object.entries(htmlEntities)) {
    text = text.split(entity).join(char);
  }
  
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  
  return text.trim();
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function getReadingTime(content: string): number {
  const text = stripHtml(content);
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

const CATEGORY_FALLBACK_IMAGES: Record<string, Array<{ url: string; alt: string }>> = {
  'abandoned-asylums-hospitals': [
    { url: '/assets/fallbacks/abandoned_asylum_dark_corridor.png', alt: 'Eerie abandoned asylum corridor with peeling walls and moonlight' },
    { url: '/assets/fallbacks/asylum_corridor_with_wheelchair.png', alt: 'Dark asylum corridor with abandoned wheelchair in shadows' },
    { url: '/assets/fallbacks/victorian_psychiatric_ward_beds.png', alt: 'Decrepit Victorian psychiatric ward with rusted iron beds' },
  ],
  'cultural-ghost-folklore': [
    { url: '/assets/fallbacks/mysterious_shrine_in_fog.png', alt: 'Japanese shrine gates in foggy bamboo forest at dusk' },
    { url: '/assets/fallbacks/victorian_seance_room.png', alt: 'Victorian seance room with candles and ouija board' },
    { url: '/assets/fallbacks/foggy_cemetery_at_midnight.png', alt: 'Ancient cemetery at midnight with fog and weathered tombstones' },
  ],
  'ghost-hunting-techniques-tools': [
    { url: '/assets/fallbacks/ghost_hunting_equipment_display.png', alt: 'Professional ghost hunting equipment including EMF detectors' },
    { url: '/assets/fallbacks/ghost_hunting_equipment_table.png', alt: 'Ghost hunting equipment on wooden table with moody lighting' },
    { url: '/assets/fallbacks/investigator_with_emf_meter.png', alt: 'Paranormal investigator silhouette with glowing EMF meter' },
  ],
  'haunted-castles-estates': [
    { url: '/assets/fallbacks/haunted_victorian_mansion_night.png', alt: 'Haunted Victorian mansion at night with fog and moonlight' },
    { url: '/assets/fallbacks/gothic_castle_with_moon.png', alt: 'Gothic castle at night with full moon and ravens' },
    { url: '/assets/fallbacks/haunted_victorian_ballroom.png', alt: 'Abandoned grand ballroom with dusty chandeliers and ghostly mist' },
  ],
  'haunted-places-case-studies': [
    { url: '/assets/fallbacks/paranormal_investigation_team_silhouettes.png', alt: 'Paranormal investigation team exploring dark historic location' },
    { url: '/assets/fallbacks/stormy_abandoned_lighthouse.png', alt: 'Abandoned lighthouse on rocky cliff during storm' },
    { url: '/assets/fallbacks/foggy_cemetery_at_midnight.png', alt: 'Foggy cemetery with weathered tombstones at midnight' },
  ],
  'historical-hauntings-insights': [
    { url: '/assets/fallbacks/historical_haunting_victorian_sepia.png', alt: 'Historical Victorian haunted photograph with antique aesthetic' },
    { url: '/assets/fallbacks/victorian_seance_room.png', alt: 'Victorian seance room with spiritualist atmosphere' },
    { url: '/assets/fallbacks/haunted_victorian_ballroom.png', alt: 'Haunted Victorian ballroom with torn curtains and moonlight' },
  ],
  'paranormal-evidence-archive': [
    { url: '/assets/fallbacks/evp_spirit_communication_equipment.png', alt: 'EVP spirit communication equipment with vintage recorders' },
    { url: '/assets/fallbacks/evp_recording_session_setup.png', alt: 'EVP recording session with vinyl player and vintage microphone' },
    { url: '/assets/fallbacks/ghost_hunting_equipment_table.png', alt: 'Paranormal investigation equipment display' },
  ],
  'personal-ghost-encounters': [
    { url: '/assets/fallbacks/misty_dark_forest_supernatural.png', alt: 'Mysterious dark forest path with supernatural fog' },
    { url: '/assets/fallbacks/haunted_forest_path.png', alt: 'Haunted forest path at night with ghostly figure' },
    { url: '/assets/fallbacks/foggy_cemetery_at_midnight.png', alt: 'Eerie cemetery at midnight with rolling fog' },
  ],
};

const DEFAULT_FALLBACK_IMAGES = [
  { url: '/assets/fallbacks/misty_dark_forest_supernatural.png', alt: 'Mysterious dark forest path with supernatural atmosphere' },
  { url: '/assets/fallbacks/haunted_forest_path.png', alt: 'Dark misty forest path at night' },
  { url: '/assets/fallbacks/foggy_cemetery_at_midnight.png', alt: 'Foggy cemetery at midnight' },
];

export interface FeaturedImageResult {
  url: string;
  width: number;
  height: number;
  alt: string;
  isFallback?: boolean;
}

function getCategoryFallbackImage(post: WPPost): { url: string; alt: string } {
  const categories = getCategories_Post(post);
  const postId = post.id || 0;
  
  for (const category of categories) {
    const slug = category.slug.toLowerCase();
    const images = CATEGORY_FALLBACK_IMAGES[slug];
    if (images && images.length > 0) {
      const index = postId % images.length;
      return images[index];
    }
  }
  
  const defaultIndex = postId % DEFAULT_FALLBACK_IMAGES.length;
  return DEFAULT_FALLBACK_IMAGES[defaultIndex];
}

function buildEnhancedAltText(post: WPPost, mediaAlt?: string): string {
  if (mediaAlt && mediaAlt.trim().length > 10) {
    return mediaAlt;
  }
  const title = stripHtml(post.title.rendered);
  const categories = getCategories_Post(post);
  const primaryCategory = categories[0]?.name || 'Paranormal';
  return `${title} - ${primaryCategory} - Cursed Tours`;
}

// Local featured image mapping (migrated from WordPress)
import featuredImageMap from './featured-image-map.json';
const FEATURED_IMAGE_MAP: Record<string, string> = featuredImageMap;

export function getFeaturedImage(post: WPPost, size: 'medium' | 'medium_large' | 'large' = 'medium_large'): FeaturedImageResult {
  const title = stripHtml(post.title.rendered);
  
  // Priority 1: Use Viator tour thumbnail if available (product-specific image from CDN)
  const viatorTour = post.meta?.viator_tour;
  if (viatorTour?.thumbnailUrl) {
    return {
      url: viatorTour.thumbnailUrl,
      width: 1200,
      height: 800,
      alt: viatorTour.title || title,
      isFallback: false,
    };
  }
  
  // Priority 2: Use local optimized WebP image (migrated from WordPress)
  const localImage = FEATURED_IMAGE_MAP[post.slug];
  if (localImage) {
    return {
      url: localImage,
      width: 1200,
      height: 800,
      alt: title,
      isFallback: false,
    };
  }
  
  // Priority 3: Use WordPress embedded featured media
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (media?.source_url) {
    const sizes = media.media_details?.sizes;
    const selectedSize = sizes?.[size] || sizes?.large || sizes?.medium_large || sizes?.full;
    const imageUrl = transformImageUrl(selectedSize?.source_url || media.source_url);
    
    return {
      url: imageUrl,
      width: selectedSize?.width || media.media_details?.width || 1200,
      height: selectedSize?.height || media.media_details?.height || 800,
      alt: media.alt_text || title,
      isFallback: false,
    };
  }
  
  // Priority 4: Fall back to category-specific images for consistent, high-quality paranormal imagery
  const fallback = getCategoryFallbackImage(post);
  return {
    url: fallback.url,
    width: 1920,
    height: 1080,
    alt: buildEnhancedAltText(post, fallback.alt),
    isFallback: true,
  };
}
const AUTHOR_AVATARS: Record<string, string> = {
  'marcus-hale': '/author-marcus-hale.webp',
  'marcus hale': '/author-marcus-hale.webp',
};

export function getAuthor(post: WPPost) {
  const author = post._embedded?.author?.[0];
  if (!author) return undefined;
  const authorSlug = author.slug?.toLowerCase() || author.name?.toLowerCase() || '';
  const customAvatar = AUTHOR_AVATARS[authorSlug];
  if (customAvatar) return { ...author, avatar_urls: { '24': customAvatar, '48': customAvatar, '96': customAvatar } };
  return author;
}

export function getCategories_Post(post: WPPost): WPCategory[] {
  const terms = post._embedded?.['wp:term']?.[0];
  if (!Array.isArray(terms)) return [];
  return terms.filter((t): t is WPCategory => 'slug' in t && 'name' in t);
}

export function getTags_Post(post: WPPost): WPTag[] {
  const terms = post._embedded?.['wp:term']?.[1];
  if (!Array.isArray(terms)) return [];
  return terms.filter((t): t is WPTag => 'count' in t);
}

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
  _embedded?: { author?: WPAuthor[]; 'wp:featuredmedia'?: WPMedia[]; };
}

function transformPage(page: WPPage): WPPage {
  return {
    ...page,
    content: { ...page.content, rendered: transformPostContent(page.content.rendered) },
    excerpt: { ...page.excerpt, rendered: transformPostContent(page.excerpt.rendered) },
  };
}

export async function getPage(slug: string): Promise<WPPage | null> {
  try {
    const response = await fetch(`${WP_API_URL}/pages?slug=${slug}&_embed=true`, { next: { revalidate: 300 } });
    if (!response.ok) { console.warn(`WordPress API error: ${response.status}`); return null; }
    const pages: WPPage[] = await response.json();
    return pages.length > 0 ? transformPage(pages[0]) : null;
  } catch (error) {
    console.warn('WordPress API fetch failed:', error);
    return null;
  }
}

export async function getPages(): Promise<WPPage[]> {
  const pages = await fetchWP<WPPage[]>('/pages?per_page=100&_embed=true', { tags: ['pages'] }, []);
  return pages.map(transformPage);
}

export async function getAllPageSlugs(): Promise<string[]> {
  const pages = await fetchWP<WPPage[]>('/pages?per_page=100&_fields=slug', { revalidate: 3600, tags: ['pages'] }, []);
  return pages.map(p => p.slug);
}

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
