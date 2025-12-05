import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/seo';

const WP_API = process.env.NEXT_PUBLIC_WORDPRESS_URL ? `${process.env.NEXT_PUBLIC_WORDPRESS_URL}/wp-json/wp/v2` : 'https://wp.cursedtours.com/wp-json/wp/v2';

async function fetchAll(endpoint: string) {
  const items: any[] = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    try {
      const res = await fetch(`${WP_API}/${endpoint}?per_page=100&page=${page}`, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const data = await res.json();
      if (data.length === 0) break;
      items.push(...data);
      hasMore = data.length === 100;
      page++;
    } catch { break; }
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, pages, categories, tags] = await Promise.all([
    fetchAll('posts'),
    fetchAll('pages'),
    fetchAll('categories'),
    fetchAll('tags'),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_CONFIG.url, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_CONFIG.url}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((post: any) => ({
    url: `${SITE_CONFIG.url}/post/${post.slug}`,
    lastModified: new Date(post.modified),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const pageRoutes: MetadataRoute.Sitemap = pages.map((page: any) => ({
    url: `${SITE_CONFIG.url}/${page.slug}`,
    lastModified: new Date(page.modified),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.filter((c: any) => c.count > 0).map((cat: any) => ({
    url: `${SITE_CONFIG.url}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.filter((t: any) => t.count > 0).map((tag: any) => ({
    url: `${SITE_CONFIG.url}/tag/${tag.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...pageRoutes, ...categoryRoutes, ...tagRoutes];
}
