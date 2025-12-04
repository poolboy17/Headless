import type { MetadataRoute } from 'next';
import { getAllPostSlugs, getAllCategorySlugs, getAllPageSlugs } from '@/lib/wordpress';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cursedtours.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Fetch all dynamic slugs
  const [postSlugs, categorySlugs, pageSlugs] = await Promise.all([
    getAllPostSlugs().catch(() => []),
    getAllCategorySlugs().catch(() => []),
    getAllPageSlugs().catch(() => []),
  ]);

  // Post pages
  const postPages: MetadataRoute.Sitemap = postSlugs.map((slug) => ({
    url: `${baseUrl}/post/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = categorySlugs.map((slug) => ({
    url: `${baseUrl}/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // WordPress pages (excluding reserved slugs)
  const reservedSlugs = ['post', 'category', 'search', 'api', 'about-us'];
  const wpPages: MetadataRoute.Sitemap = pageSlugs
    .filter((slug) => !reservedSlugs.includes(slug))
    .map((slug) => ({
      url: `${baseUrl}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

  return [...staticPages, ...postPages, ...categoryPages, ...wpPages];
}
