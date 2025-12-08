/**
 * SEO Utilities for Cursed Tours
 * Comprehensive metadata fallback chain with Schema.org support
 */
import { Metadata } from 'next';

// Site-wide configuration
export const SITE_CONFIG = {
  name: 'Cursed Tours',
  url: 'https://cursedtours.com',
  description: 'Explore haunted locations, paranormal investigations, and supernatural travel experiences.',
  locale: 'en_US',
  twitter: '@cursedtours',
  logo: 'https://cursedtours.com/logo.png',
  defaultImage: 'https://cursedtours.com/og-image.jpg',
};

// WordPress post with SEO data interface
export interface WPPostSEO {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt?: { rendered: string };
  content?: { rendered: string };
  date: string;
  modified: string;
  yoast_head_json?: {
    title?: string;
    description?: string;
    canonical?: string;
    og_title?: string;
    og_description?: string;
    og_image?: Array<{ url: string; width?: number; height?: number }>;
  };
  rank_math?: {
    title?: string;
    description?: string;
    canonical?: string;
    robots?: { index?: string; follow?: string };
  };
  seo?: { title?: string; description?: string; canonical?: string };
  _embedded?: {
    author?: Array<{ name: string; url?: string }>;
    'wp:featuredmedia'?: Array<{ source_url: string; alt_text?: string }>;
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
}

// Helper: Strip HTML tags
export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Truncate text
export function truncateText(text: string, maxLength = 160): string {
  const stripped = stripHtml(text);
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength - 3) + '...';
}


// Get SEO title with fallback chain
export function getSeoTitle(post: WPPostSEO): string {
  return (
    post.yoast_head_json?.title ||
    post.rank_math?.title ||
    post.seo?.title ||
    stripHtml(post.title?.rendered) ||
    'Untitled'
  );
}

// Get SEO description with fallback chain
export function getSeoDescription(post: WPPostSEO): string {
  return (
    post.yoast_head_json?.description ||
    post.rank_math?.description ||
    post.seo?.description ||
    truncateText(post.excerpt?.rendered || '') ||
    SITE_CONFIG.description
  );
}

// Get canonical URL with fallback chain
export function getCanonicalUrl(post: WPPostSEO, type: 'post' | 'page' = 'post'): string {
  return (
    post.yoast_head_json?.canonical ||
    post.rank_math?.canonical ||
    post.seo?.canonical ||
    `${SITE_CONFIG.url}/${type === 'post' ? 'post/' : ''}${post.slug}`
  );
}

// Get featured image with fallback
export function getFeaturedImage(post: WPPostSEO): string {
  return (
    post.yoast_head_json?.og_image?.[0]?.url ||
    post._embedded?.['wp:featuredmedia']?.[0]?.source_url ||
    SITE_CONFIG.defaultImage
  );
}

// Get author info
export function getAuthorInfo(post: WPPostSEO): { name: string; url: string } {
  const author = post._embedded?.author?.[0];
  const name = author?.name || 'Cursed Tours Team';
  return { name, url: `${SITE_CONFIG.url}/author/${name.toLowerCase().replace(/\s+/g, '-')}` };
}

// Get categories
export function getCategories(post: WPPostSEO): Array<{ name: string; slug: string }> {
  const terms = post._embedded?.['wp:term']?.[0] || [];
  return terms.map((t) => ({ name: t.name, slug: t.slug }));
}


// Generate complete post metadata
export function generatePostMetadata(post: WPPostSEO): Metadata {
  const title = getSeoTitle(post);
  const description = getSeoDescription(post);
  const canonicalUrl = getCanonicalUrl(post, 'post');
  const image = getFeaturedImage(post);
  const author = getAuthorInfo(post);

  return {
    title: `${title} | ${SITE_CONFIG.name}`,
    description,
    authors: [{ name: author.name }],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      site: SITE_CONFIG.twitter,
    },
    robots: {
      index: post.rank_math?.robots?.index !== 'noindex',
      follow: post.rank_math?.robots?.follow !== 'nofollow',
    },
  };
}

// Generate page metadata
export function generatePageMetadata(post: WPPostSEO): Metadata {
  const title = getSeoTitle(post);
  const description = getSeoDescription(post);
  const canonicalUrl = getCanonicalUrl(post, 'page');
  const image = getFeaturedImage(post);

  return {
    title: `${title} | ${SITE_CONFIG.name}`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      type: 'website',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
      site: SITE_CONFIG.twitter,
    },
  };
}


// Generate archive/category metadata
export function generateArchiveMetadata(name: string, slug: string, type: 'category' | 'tag' = 'category'): Metadata {
  const title = `${name} Archives`;
  const description = `Browse all posts in ${name} on ${SITE_CONFIG.name}`;
  const url = `${SITE_CONFIG.url}/${type}/${slug}`;

  return {
    title: `${title} | ${SITE_CONFIG.name}`,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_CONFIG.name, type: 'website' },
    twitter: { card: 'summary', title, description, site: SITE_CONFIG.twitter },
  };
}

// Default site metadata
export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: { default: SITE_CONFIG.name, template: `%s | ${SITE_CONFIG.name}` },
  description: SITE_CONFIG.description,
  openGraph: {
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    type: 'website',
    locale: SITE_CONFIG.locale,
    images: [{ url: SITE_CONFIG.defaultImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.defaultImage],
    site: SITE_CONFIG.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};
