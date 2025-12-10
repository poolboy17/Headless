import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';
import { getAllPostsForSitemap, getAllCategoriesForSitemap } from '@/lib/posts';

// Static pages that exist in the app
const STATIC_PAGES = [
  'about-us',
  'contact-us',
  'privacy-policy',
  'terms-of-service',
  'cookie-policy',
  'affiliate-disclosure',
];

// Guide pages
const GUIDE_PAGES = [
  'guides/paranormal-investigation',
  'guides/ghost-hunting-equipment',
  'guides/urban-exploration-safety',
  'guides/abandoned-asylums',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch data from database
  const [posts, categories] = await Promise.all([
    getAllPostsForSitemap(),
    getAllCategoriesForSitemap(),
  ]);

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_CONFIG.url, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_CONFIG.url}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  // Static page routes
  const pageRoutes: MetadataRoute.Sitemap = STATIC_PAGES.map((slug) => ({
    url: `${SITE_CONFIG.url}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Guide page routes
  const guideRoutes: MetadataRoute.Sitemap = GUIDE_PAGES.map((path) => ({
    url: `${SITE_CONFIG.url}/${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Post routes from database
  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_CONFIG.url}/post/${post.slug}`,
    lastModified: post.modified,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Category routes from database
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_CONFIG.url}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...pageRoutes, ...guideRoutes, ...postRoutes, ...categoryRoutes];
}
