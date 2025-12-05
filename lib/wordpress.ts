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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cursedtours.com';

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

    const response = await fetch(`${WP_API_URL}/posts?${queryParams}`, { next: { revalidate: 300 } });
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
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
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

const CATEGORY_FALLBACK_IMAGES: Record<string, { url: string; alt: string }> = {
  'abandoned-asylums-hospitals': {
    url: '/assets/fallbacks/abandoned_asylum_dark_corridor.png',
    alt: 'Eerie abandoned asylum corridor with peeling walls and moonlight',
  },
  'cultural-ghost-folklore': {
    url: '/assets/fallbacks/historical_haunting_victorian_sepia.png',
    alt: 'Historical Victorian haunted photograph with antique aesthetic',
  },
  'ghost-hunting-techniques-tools': {
    url: '/assets/fallbacks/ghost_hunting_equipment_display.png',
    alt: 'Professional ghost hunting equipment including EMF detectors and spirit boxes',
  },
  'haunted-castles-estates': {
    url: '/assets/fallbacks/haunted_victorian_mansion_night.png',
    alt: 'Haunted Victorian mansion at night with fog and moonlight',
  },
  'haunted-places-case-studies': {
    url: '/assets/fallbacks/paranormal_investigation_team_silhouettes.png',
    alt: 'Paranormal investigation team exploring a dark historic location',
  },
  'historical-hauntings-insights': {
    url: '/assets/fallbacks/historical_haunting_victorian_sepia.png',
    alt: 'Historical Victorian haunted photograph with antique aesthetic',
  },
  'paranormal-evidence-archive': {
    url: '/assets/fallbacks/evp_spirit_communication_equipment.png',
    alt: 'EVP spirit communication equipment with vintage audio recorders',
  },
  'personal-ghost-encounters': {
    url: '/assets/fallbacks/misty_dark_forest_supernatural.png',
    alt: 'Mysterious dark forest path with fog and supernatural atmosphere',
  },
};

const DEFAULT_FALLBACK_IMAGE = {
  url: '/assets/fallbacks/misty_dark_forest_supernatural.png',
  alt: 'Mysterious dark forest path with fog and supernatural atmosphere',
};

const IRRELEVANT_IMAGE_BLOCKLIST = [
  'neon', 'sign', 'tips', 'travel', 'stock-photo', 'best', 'top-10', 'quote', 'true', 'real',
  'banner', 'icon', 'logo', 'badge', 'label', 'tag', 'button', 'arrow',
  'generic', 'placeholder', 'template', 'mockup', 'shutterstock', 'istock',
  'getty', 'depositphotos', 'dreamstime', 'fotolia', 'clipart', 'vector',
  'abstract', 'pattern', 'texture', 'background-image', 'wallpaper',
  'office', 'business', 'corporate', 'meeting', 'handshake', 'teamwork',
  'laptop', 'computer', 'desk', 'keyboard', 'mouse', 'phone', 'smartphone',
  'coffee', 'cafe', 'restaurant', 'food', 'drink', 'wine', 'beer', 'cocktail',
  'beach', 'vacation', 'holiday', 'summer', 'tropical', 'palm-tree', 'sunset-beach',
  'city-skyline', 'skyscraper', 'downtown', 'urban-modern', 'architecture-modern',
  'car', 'vehicle', 'automobile', 'motorcycle', 'bike', 'bicycle',
  'sports', 'fitness', 'gym', 'workout', 'exercise', 'running', 'yoga',
  'shopping', 'retail', 'store', 'mall', 'fashion', 'clothing', 'shoes',
  'money', 'dollar', 'currency', 'finance', 'investment', 'banking', 'credit-card',
  'medical', 'hospital', 'doctor', 'nurse', 'healthcare', 'medicine', 'pills',
  'baby', 'child', 'kids', 'family-happy', 'couple-happy', 'friends-happy',
  'wedding', 'birthday', 'party', 'celebration', 'confetti', 'balloon',
  'pet', 'dog', 'cat', 'puppy', 'kitten', 'animal-cute',
  'flower', 'garden', 'plant', 'tree-green', 'nature-bright', 'landscape-sunny',
  'sky-blue', 'cloud-white', 'rainbow', 'sunrise-bright', 'sunset-orange',
];

const PARANORMAL_IMAGE_ALLOWLIST = [
  'ghost', 'haunted', 'spooky', 'creepy', 'scary', 'horror', 'dark', 'eerie',
  'paranormal', 'supernatural', 'spirit', 'specter', 'phantom', 'apparition',
  'cemetery', 'graveyard', 'tombstone', 'grave', 'crypt', 'mausoleum',
  'abandoned', 'ruins', 'decay', 'dilapidated', 'derelict', 'crumbling',
  'asylum', 'hospital-abandoned', 'sanatorium', 'institution', 'ward',
  'mansion', 'manor', 'estate', 'castle', 'chateau', 'palace-old', 'victorian',
  'gothic', 'medieval', 'ancient', 'historic', 'antique', 'vintage-dark',
  'fog', 'mist', 'shadow', 'darkness', 'night', 'moonlight', 'twilight',
  'investigation', 'investigator', 'detective', 'flashlight', 'torch',
  'emf', 'detector', 'equipment', 'device', 'meter', 'sensor', 'recorder',
  'evp', 'audio', 'recording', 'waveform', 'frequency', 'spirit-box',
  'seance', 'ouija', 'occult', 'ritual', 'candle', 'candlelight',
  'corridor', 'hallway', 'staircase', 'door', 'window-broken', 'attic', 'basement',
  'portrait', 'photograph-old', 'frame-antique', 'mirror', 'reflection',
  'forest-dark', 'woods', 'path-dark', 'road-abandoned', 'tunnel',
  'silhouette', 'figure', 'shadow-figure', 'presence', 'entity',
  'skull', 'skeleton', 'bones', 'death', 'mortality',
  'church', 'chapel', 'cathedral', 'monastery', 'abbey', 'convent',
  'prison', 'jail', 'cell', 'dungeon', 'tower', 'fortress',
  'lighthouse', 'shipwreck', 'ship-old', 'sailor', 'maritime',
  'hotel', 'inn', 'tavern', 'saloon', 'theater', 'opera-house',
  'battlefield', 'war', 'soldier', 'military', 'civil-war', 'revolutionary',
];

function isImageIrrelevant(imageUrl: string, altText: string): boolean {
  const searchText = `${imageUrl} ${altText}`.toLowerCase();
  
  const hasAllowedTerm = PARANORMAL_IMAGE_ALLOWLIST.some(term => 
    searchText.includes(term.toLowerCase())
  );
  if (hasAllowedTerm) {
    return false;
  }
  
  const hasBlockedTerm = IRRELEVANT_IMAGE_BLOCKLIST.some(term => 
    searchText.includes(term.toLowerCase())
  );
  
  return hasBlockedTerm;
}

export interface FeaturedImageResult {
  url: string;
  width: number;
  height: number;
  alt: string;
  isFallback?: boolean;
}

function getCategoryFallbackImage(post: WPPost): { url: string; alt: string } | null {
  const categories = getCategories_Post(post);
  for (const category of categories) {
    const slug = category.slug.toLowerCase();
    if (CATEGORY_FALLBACK_IMAGES[slug]) {
      return CATEGORY_FALLBACK_IMAGES[slug];
    }
  }
  return null;
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

export function getFeaturedImage(post: WPPost, size: 'medium' | 'medium_large' | 'large' = 'medium_large'): FeaturedImageResult | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  
  if (media) {
    const imageUrl = media.source_url || '';
    const altText = media.alt_text || '';
    
    if (isImageIrrelevant(imageUrl, altText)) {
      console.info(`[Image Override] Post "${stripHtml(post.title.rendered)}" - irrelevant stock image detected, using category fallback`);
      const categoryFallback = getCategoryFallbackImage(post);
      if (categoryFallback) {
        return {
          url: categoryFallback.url,
          width: 1920,
          height: 1080,
          alt: buildEnhancedAltText(post, categoryFallback.alt),
          isFallback: true,
        };
      }
      return {
        url: DEFAULT_FALLBACK_IMAGE.url,
        width: 1920,
        height: 1080,
        alt: buildEnhancedAltText(post, DEFAULT_FALLBACK_IMAGE.alt),
        isFallback: true,
      };
    }
    
    const sizes = media.media_details?.sizes;
    const selectedSize = sizes?.[size] || sizes?.large || sizes?.medium_large;
    return {
      url: transformImageUrl(selectedSize?.source_url || media.source_url),
      width: selectedSize?.width || media.media_details?.width || 800,
      height: selectedSize?.height || media.media_details?.height || 600,
      alt: buildEnhancedAltText(post, media.alt_text),
      isFallback: false,
    };
  }
  
  const categoryFallback = getCategoryFallbackImage(post);
  if (categoryFallback) {
    return {
      url: categoryFallback.url,
      width: 1920,
      height: 1080,
      alt: buildEnhancedAltText(post, categoryFallback.alt),
      isFallback: true,
    };
  }
  
  return {
    url: DEFAULT_FALLBACK_IMAGE.url,
    width: 1920,
    height: 1080,
    alt: buildEnhancedAltText(post, DEFAULT_FALLBACK_IMAGE.alt),
    isFallback: true,
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
  if (customAvatar) return { ...author, avatar_urls: { '24': customAvatar, '48': customAvatar, '96': customAvatar } };
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
