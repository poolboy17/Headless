/**
 * Centralized SEO Configuration
 * IMPORTANT: All URL references should use this file to ensure consistency
 * The canonical domain is https://cursedtours.com (NO www)
 */

// The canonical site URL - NO www prefix
export const SITE_URL = 'https://cursedtours.com';

// Site metadata
export const SITE_NAME = 'Cursed Tours';
export const SITE_TAGLINE = "Some Boundaries Aren't Meant to Be Crossed";
export const SITE_DESCRIPTION = "Some boundaries aren't meant to be crossed. Explore haunted places, ghost hunting techniques, and paranormal investigations with Cursed Tours.";

// Default OG image
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Generate canonical URL for a given path
 * @param path - The path without leading slash (e.g., 'post/my-slug' or 'category/haunted-places')
 */
export function getCanonicalUrl(path?: string): string {
  if (!path) return SITE_URL;
  // Ensure path doesn't start with slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${SITE_URL}/${cleanPath}`;
}

/**
 * Get the base metadata for pages
 */
export function getBaseMetadata() {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} | ${SITE_TAGLINE}`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      type: 'website' as const,
      siteName: SITE_NAME,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image' as const,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: SITE_URL,
    },
  };
}
