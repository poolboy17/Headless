/**
 * Schema.org Structured Data Components
 * JSON-LD schemas for SEO
 */
import { SITE_CONFIG, WPPostSEO, getSeoTitle, getSeoDescription, getFeaturedImage, getAuthorInfo, getCategories, stripHtml } from '@/lib/seo';

// Organization Schema
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: { '@type': 'ImageObject', url: SITE_CONFIG.logo },
    sameAs: [],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// WebSite Schema
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.url}/#website`,
    url: SITE_CONFIG.url,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    publisher: { '@id': `${SITE_CONFIG.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}


// Article Schema for blog posts
export function ArticleSchema({ post }: { post: WPPostSEO }) {
  const author = getAuthorInfo(post);
  const categories = getCategories(post);
  const wordCount = stripHtml(post.content?.rendered || '').split(/\s+/).length;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE_CONFIG.url}/post/${post.slug}/#article`,
    headline: getSeoTitle(post),
    description: getSeoDescription(post),
    image: getFeaturedImage(post),
    datePublished: post.date,
    dateModified: post.modified,
    author: { '@type': 'Person', name: author.name, url: author.url },
    publisher: { '@id': `${SITE_CONFIG.url}/#organization` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_CONFIG.url}/post/${post.slug}` },
    wordCount,
    articleSection: categories.map((c) => c.name),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// WebPage Schema
export function WebPageSchema({ post, type = 'WebPage' }: { post: WPPostSEO; type?: string }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${SITE_CONFIG.url}/${post.slug}/#webpage`,
    url: `${SITE_CONFIG.url}/${post.slug}`,
    name: getSeoTitle(post),
    description: getSeoDescription(post),
    isPartOf: { '@id': `${SITE_CONFIG.url}/#website` },
    primaryImageOfPage: { '@type': 'ImageObject', url: getFeaturedImage(post) },
    datePublished: post.date,
    dateModified: post.modified,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}


// Breadcrumb Schema
export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// Post Breadcrumb (auto-generated)
export function PostBreadcrumbSchema({ post }: { post: WPPostSEO }) {
  const categories = getCategories(post);
  const items = [
    { name: 'Home', url: SITE_CONFIG.url },
    ...(categories[0] ? [{ name: categories[0].name, url: `${SITE_CONFIG.url}/category/${categories[0].slug}` }] : []),
    { name: getSeoTitle(post), url: `${SITE_CONFIG.url}/post/${post.slug}` },
  ];
  return <BreadcrumbSchema items={items} />;
}

// Collection Page Schema (for category/tag archives)
export function CollectionPageSchema({ name, slug, type, posts }: { name: string; slug: string; type: 'category' | 'tag'; posts: WPPostSEO[] }) {
  const url = `${SITE_CONFIG.url}/${type}/${slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}/#collectionpage`,
    url,
    name: `${name} Archives`,
    description: `Browse all posts in ${name}`,
    isPartOf: { '@id': `${SITE_CONFIG.url}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.slice(0, 10).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_CONFIG.url}/post/${post.slug}`,
      })),
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// Combined Schema for Posts
export function PostSchema({ post }: { post: WPPostSEO }) {
  return (
    <>
      <ArticleSchema post={post} />
      <PostBreadcrumbSchema post={post} />
    </>
  );
}

// Combined Schema for Pages
export function PageSchema({ post }: { post: WPPostSEO }) {
  return <WebPageSchema post={post} />;
}

// Site-wide Schema (for layout)
export function SiteSchema() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
    </>
  );
}
