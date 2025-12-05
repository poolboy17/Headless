/**
 * Schema.org Structured Data Components
 * Enhanced JSON-LD schemas for SEO Rich Results
 */
import { SITE_CONFIG, WPPostSEO, getSeoTitle, getSeoDescription, getFeaturedImage, getAuthorInfo, getCategories, stripHtml } from '@/lib/seo';

// ============================================
// SITE-WIDE SCHEMAS
// ============================================

// Enhanced Organization Schema with social profiles
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: SITE_CONFIG.logo,
      width: 512,
      height: 512,
    },
    image: SITE_CONFIG.logo,
    description: SITE_CONFIG.description,
    // Add your social profiles here for Knowledge Panel
    sameAs: [
      // 'https://twitter.com/cursedtours',
      // 'https://facebook.com/cursedtours',
      // 'https://instagram.com/cursedtours',
      // 'https://youtube.com/@cursedtours',
    ].filter(Boolean),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// WebSite Schema with SearchAction
export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.url}/#website`,
    url: SITE_CONFIG.url,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    publisher: { '@id': `${SITE_CONFIG.url}/#organization` },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// ============================================
// ARTICLE SCHEMAS
// ============================================

// Enhanced Article Schema with proper ImageObject
export function ArticleSchema({ post }: { post: WPPostSEO }) {
  const author = getAuthorInfo(post);
  const categories = getCategories(post);
  const content = stripHtml(post.content?.rendered || '');
  const wordCount = content.split(/\s+/).length;
  const image = getFeaturedImage(post);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE_CONFIG.url}/post/${post.slug}/#article`,
    headline: getSeoTitle(post),
    description: getSeoDescription(post),
    image: {
      '@type': 'ImageObject',
      url: image,
      width: 1200,
      height: 630,
    },
    datePublished: post.date,
    dateModified: post.modified,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url || `${SITE_CONFIG.url}/author/${author.name.toLowerCase().replace(/\s+/g, '-')}`,
    },
    publisher: {
      '@id': `${SITE_CONFIG.url}/#organization`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/post/${post.slug}`,
    },
    wordCount,
    articleSection: categories.map((c) => c.name),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}


// ============================================
// ⭐ FAQ SCHEMA - Shows FAQ dropdowns in Google!
// ============================================

interface FAQItem {
  question: string;
  answer: string;
}

// FAQ Schema - Use this when posts have Q&A sections
export function FAQSchema({ faqs }: { faqs: FAQItem[] }) {
  if (!faqs || faqs.length === 0) return null;
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// Auto-extract FAQs from post content (looks for Q: or Question: patterns)
export function extractFAQsFromContent(content: string): FAQItem[] {
  const faqs: FAQItem[] = [];
  const text = stripHtml(content);
  
  // Pattern 1: "Q: question" followed by "A: answer"
  const qaPattern = /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gi;
  let match;
  while ((match = qaPattern.exec(text)) !== null) {
    faqs.push({ question: match[1].trim(), answer: match[2].trim() });
  }
  
  // Pattern 2: Headers that are questions (end with ?)
  const questionHeaders = content.match(/<h[2-4][^>]*>([^<]+\?)<\/h[2-4]>/gi);
  if (questionHeaders && faqs.length === 0) {
    questionHeaders.slice(0, 5).forEach((header) => {
      const question = stripHtml(header);
      // Try to get the next paragraph as answer
      const headerIndex = content.indexOf(header);
      const nextParagraph = content.slice(headerIndex).match(/<p[^>]*>([^<]+)<\/p>/i);
      if (nextParagraph) {
        faqs.push({ question, answer: stripHtml(nextParagraph[1]).slice(0, 300) });
      }
    });
  }
  
  return faqs.slice(0, 10); // Google recommends max 10 FAQs
}

// ============================================
// ⭐ HOWTO SCHEMA - Shows step-by-step cards!
// ============================================

interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

// HowTo Schema - Perfect for tutorial posts!
export function HowToSchema({ 
  name, 
  description, 
  steps,
  totalTime,
  image,
}: { 
  name: string; 
  description: string; 
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration, e.g., "PT30M" for 30 minutes
  image?: string;
}) {
  if (!steps || steps.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(image && { image }),
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// Auto-extract HowTo steps from numbered lists in content
export function extractHowToSteps(content: string): HowToStep[] {
  const steps: HowToStep[] = [];
  
  // Pattern: Look for ordered lists
  const listItems = content.match(/<li[^>]*>(.+?)<\/li>/gi);
  if (listItems) {
    listItems.slice(0, 10).forEach((item) => {
      const text = stripHtml(item);
      if (text.length > 10) {
        steps.push({
          name: text.slice(0, 60) + (text.length > 60 ? '...' : ''),
          text: text,
        });
      }
    });
  }
  
  return steps;
}


// ============================================
// ⭐ ITEMLIST SCHEMA - Can show carousel in Google!
// ============================================

// ItemList Schema for homepage featured/trending posts
export function ItemListSchema({ 
  name, 
  posts,
  itemType = 'Article',
}: { 
  name: string; 
  posts: WPPostSEO[];
  itemType?: 'Article' | 'ListItem';
}) {
  if (!posts || posts.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: posts.length,
    itemListElement: posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_CONFIG.url}/post/${post.slug}`,
      name: getSeoTitle(post),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// ============================================
// BREADCRUMB SCHEMA
// ============================================

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

// Auto-generated breadcrumb for posts
export function PostBreadcrumbSchema({ post }: { post: WPPostSEO }) {
  const categories = getCategories(post);
  const items = [
    { name: 'Home', url: SITE_CONFIG.url },
    ...(categories[0] ? [{ name: categories[0].name, url: `${SITE_CONFIG.url}/category/${categories[0].slug}` }] : []),
    { name: getSeoTitle(post), url: `${SITE_CONFIG.url}/post/${post.slug}` },
  ];
  return <BreadcrumbSchema items={items} />;
}

// ============================================
// PAGE SCHEMAS
// ============================================

// WebPage Schema for static pages
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
    inLanguage: 'en-US',
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

// CollectionPage Schema for category/tag archives
export function CollectionPageSchema({ 
  name, 
  slug, 
  type, 
  posts,
  description,
}: { 
  name: string; 
  slug: string; 
  type: 'category' | 'tag'; 
  posts: WPPostSEO[];
  description?: string;
}) {
  const url = `${SITE_CONFIG.url}/${type}/${slug}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}/#collectionpage`,
    url,
    name: `${name} - ${SITE_CONFIG.name}`,
    description: description || `Browse all ${name} articles on ${SITE_CONFIG.name}`,
    isPartOf: { '@id': `${SITE_CONFIG.url}/#website` },
    inLanguage: 'en-US',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.slice(0, 10).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_CONFIG.url}/post/${post.slug}`,
        name: getSeoTitle(post),
      })),
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}


// ============================================
// COMBINED SCHEMA EXPORTS
// ============================================

// Combined Schema for Posts (standard)
export function PostSchema({ post }: { post: WPPostSEO }) {
  return (
    <>
      <ArticleSchema post={post} />
      <PostBreadcrumbSchema post={post} />
    </>
  );
}

// Enhanced Post Schema with auto-detected FAQ/HowTo
export function EnhancedPostSchema({ post }: { post: WPPostSEO }) {
  const content = post.content?.rendered || '';
  const title = getSeoTitle(post).toLowerCase();
  
  // Auto-detect if this is a HowTo post (titles with "how to", "guide", "tips", numbers)
  const isHowTo = /how to|guide|tips|\d+\s+(ways|steps|things)/i.test(title);
  const steps = isHowTo ? extractHowToSteps(content) : [];
  
  // Auto-extract FAQs from content
  const faqs = extractFAQsFromContent(content);
  
  return (
    <>
      <ArticleSchema post={post} />
      <PostBreadcrumbSchema post={post} />
      {faqs.length > 0 && <FAQSchema faqs={faqs} />}
      {steps.length >= 3 && (
        <HowToSchema
          name={getSeoTitle(post)}
          description={getSeoDescription(post)}
          steps={steps}
          image={getFeaturedImage(post)}
        />
      )}
    </>
  );
}

// Combined Schema for Static Pages
export function PageSchema({ post }: { post: WPPostSEO }) {
  return <WebPageSchema post={post} />;
}

// Site-wide Schema (for layout.tsx)
export function SiteSchema() {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
    </>
  );
}

// Homepage Schema with featured posts
export function HomePageSchema({ featuredPosts }: { featuredPosts?: WPPostSEO[] }) {
  return (
    <>
      <OrganizationSchema />
      <WebSiteSchema />
      {featuredPosts && featuredPosts.length > 0 && (
        <ItemListSchema name="Featured Articles" posts={featuredPosts} />
      )}
    </>
  );
}

// ============================================
// TYPE EXPORTS
// ============================================

export type { FAQItem, HowToStep };
