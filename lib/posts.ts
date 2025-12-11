import { db, posts, categories, authors, postCategories } from "./db";
import type { Post, Category, Author } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import type { WPPost, WPCategory, WPAuthor } from "@/lib/wordpress";

// ============================================================
// POST QUERIES
// ============================================================

export interface PostWithRelations extends Post {
  author: Author | null;
  categories: Category[];
}

export async function getPostBySlug(slug: string): Promise<PostWithRelations | null> {
  const result = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);

  if (result.length === 0) return null;

  const post = result[0];

  // Get author
  let author: Author | null = null;
  if (post.authorId) {
    const authorResult = await db
      .select()
      .from(authors)
      .where(eq(authors.id, post.authorId))
      .limit(1);
    author = authorResult[0] || null;
  }

  // Get categories
  const postCats = await db
    .select({ category: categories })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(eq(postCategories.postId, post.id));

  return {
    ...post,
    author,
    categories: postCats.map((pc) => pc.category),
  };
}

export async function getPosts(options: {
  limit?: number;
  offset?: number;
  categorySlug?: string;
  search?: string;
} = {}): Promise<{ posts: PostWithRelations[]; total: number }> {
  const { limit = 10, offset = 0, categorySlug, search } = options;

  // Handle search queries
  if (search && search.trim()) {
    const searchTerm = `%${search.toLowerCase()}%`;
    const result = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.status, "published"),
          sql`(LOWER(${posts.title}) LIKE ${searchTerm} OR LOWER(${posts.content}) LIKE ${searchTerm} OR LOWER(${posts.excerpt}) LIKE ${searchTerm})`
        )
      )
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(
        and(
          eq(posts.status, "published"),
          sql`(LOWER(${posts.title}) LIKE ${searchTerm} OR LOWER(${posts.content}) LIKE ${searchTerm} OR LOWER(${posts.excerpt}) LIKE ${searchTerm})`
        )
      );

    const postsWithRelations = await addRelationsToPost(result);
    return {
      posts: postsWithRelations,
      total: Number(countResult[0]?.count || 0),
    };
  }

  let query = db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);

  // If filtering by category, we need a different approach
  if (categorySlug) {
    const cat = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (cat.length === 0) {
      return { posts: [], total: 0 };
    }

    const postIds = await db
      .select({ postId: postCategories.postId })
      .from(postCategories)
      .where(eq(postCategories.categoryId, cat[0].id));

    if (postIds.length === 0) {
      return { posts: [], total: 0 };
    }

    const ids = postIds.map((p) => p.postId);
    const result = await db
      .select()
      .from(posts)
      .where(and(eq(posts.status, "published"), inArray(posts.id, ids)))
      .orderBy(desc(posts.publishedAt))
      .limit(limit)
      .offset(offset);

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(eq(posts.status, "published"), inArray(posts.id, ids)));

    const postsWithRelations = await addRelationsToPost(result);
    return {
      posts: postsWithRelations,
      total: Number(countResult[0]?.count || 0),
    };
  }

  const result = await query;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.status, "published"));

  const postsWithRelations = await addRelationsToPost(result);

  return {
    posts: postsWithRelations,
    total: Number(countResult[0]?.count || 0),
  };
}

async function addRelationsToPost(postList: Post[]): Promise<PostWithRelations[]> {
  if (postList.length === 0) return [];

  // Get all author IDs
  const authorIds = [...new Set(postList.filter((p) => p.authorId).map((p) => p.authorId!))];
  const authorsMap = new Map<string, Author>();

  if (authorIds.length > 0) {
    const authorsList = await db
      .select()
      .from(authors)
      .where(inArray(authors.id, authorIds));
    authorsList.forEach((a) => authorsMap.set(a.id, a));
  }

  // Get all categories for posts
  const postIds = postList.map((p) => p.id);
  const allPostCats = await db
    .select({
      postId: postCategories.postId,
      category: categories,
    })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(inArray(postCategories.postId, postIds));

  const catsMap = new Map<string, Category[]>();
  allPostCats.forEach((pc) => {
    const existing = catsMap.get(pc.postId) || [];
    existing.push(pc.category);
    catsMap.set(pc.postId, existing);
  });

  return postList.map((post) => ({
    ...post,
    author: post.authorId ? authorsMap.get(post.authorId) || null : null,
    categories: catsMap.get(post.id) || [],
  }));
}

export async function getRelatedPosts(
  postId: string,
  categoryIds: string[],
  limit: number = 4
): Promise<PostWithRelations[]> {
  if (categoryIds.length === 0) return [];

  // Get posts in same categories
  const relatedPostIds = await db
    .select({ postId: postCategories.postId })
    .from(postCategories)
    .where(inArray(postCategories.categoryId, categoryIds));

  const ids = [...new Set(relatedPostIds.map((p) => p.postId))].filter((id) => id !== postId);

  if (ids.length === 0) return [];

  const result = await db
    .select()
    .from(posts)
    .where(and(eq(posts.status, "published"), inArray(posts.id, ids.slice(0, limit))))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);

  return addRelationsToPost(result);
}

export async function getAllPostSlugs(): Promise<string[]> {
  const result = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(eq(posts.status, "published"));

  return result.map((r) => r.slug);
}

// ============================================================
// CATEGORY QUERIES
// ============================================================

export async function getCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .orderBy(desc(categories.count));
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const result = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return result[0] || null;
}

// ============================================================
// AUTHOR QUERIES
// ============================================================

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const result = await db
    .select()
    .from(authors)
    .where(eq(authors.slug, slug))
    .limit(1);

  return result[0] || null;
}

// ============================================================
// HELPERS
// ============================================================

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ============================================================
// WORDPRESS COMPATIBILITY ADAPTERS
// ============================================================

/**
 * Converts a database PostWithRelations to WPPost format
 * for backward compatibility with existing components
 */
export function toWPPost(post: PostWithRelations): WPPost {
  const wpCategories: WPCategory[] = post.categories.map((cat, index) => ({
    id: index + 1, // Use index as numeric ID
    count: cat.count || 0,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || undefined,
    link: `https://cursedtours.com/category/${cat.slug}`,
  }));

  const wpAuthor: WPAuthor | undefined = post.author
    ? {
        id: 1,
        name: post.author.name,
        slug: post.author.slug,
        description: post.author.description || undefined,
        avatar_urls: post.author.avatarUrl
          ? { "24": post.author.avatarUrl, "48": post.author.avatarUrl, "96": post.author.avatarUrl }
          : undefined,
        link: `https://cursedtours.com/author/${post.author.slug}`,
      }
    : undefined;

  return {
    id: parseInt(post.id.replace(/-/g, "").slice(0, 8), 16) || 1,
    date: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    date_gmt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    modified: post.updatedAt.toISOString(),
    modified_gmt: post.updatedAt.toISOString(),
    slug: post.slug,
    status: post.status === "published" ? "publish" : post.status,
    type: "post",
    link: `https://cursedtours.com/post/${post.slug}`,
    title: { rendered: post.title },
    content: { rendered: post.content, protected: false },
    excerpt: { rendered: post.excerpt || "" },
    author: 1,
    featured_media: post.featuredImageUrl ? 1 : 0,
    categories: wpCategories.map((_, i) => i + 1),
    tags: [],
    _embedded: {
      author: wpAuthor ? [wpAuthor] : undefined,
      "wp:featuredmedia": post.featuredImageUrl
        ? [
            {
              id: 1,
              source_url: post.featuredImageUrl,
              alt_text: post.featuredImageAlt || post.title,
              media_details: { width: 1200, height: 800 },
            },
          ]
        : undefined,
      "wp:term": wpCategories.length > 0 ? [wpCategories] : undefined,
    },
  };
}

/**
 * Get a post with related posts in WPPost format
 */
export async function getPostForPage(
  slug: string
): Promise<{ post: WPPost; relatedPosts: WPPost[] } | null> {
  const dbPost = await getPostBySlug(slug);
  if (!dbPost) return null;

  const categoryIds = dbPost.categories.map((c) => c.id);
  const dbRelated = await getRelatedPosts(dbPost.id, categoryIds, 4);

  return {
    post: toWPPost(dbPost),
    relatedPosts: dbRelated.map(toWPPost),
  };
}

/**
 * Get reading time for a post
 */
export function getReadingTime(content: string): number {
  const text = stripHtml(content);
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200);
}

/**
 * Get posts for homepage/listing pages in WPPost format
 */
export async function getPostsForPage(options: {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  search?: string;
} = {}): Promise<{ posts: WPPost[]; totalPages: number; totalPosts: number }> {
  const { page = 1, perPage = 10, categorySlug, search } = options;
  const offset = (page - 1) * perPage;

  const result = await getPosts({
    limit: perPage,
    offset,
    categorySlug,
    search,
  });

  return {
    posts: result.posts.map(toWPPost),
    totalPages: Math.ceil(result.total / perPage),
    totalPosts: result.total,
  };
}

/**
 * Get all categories in WPCategory format
 */
export async function getCategoriesForPage(): Promise<WPCategory[]> {
  const cats = await getCategories();
  return cats.map((cat, index) => ({
    id: index + 1,
    count: cat.count || 0,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || undefined,
    link: `https://cursedtours.com/category/${cat.slug}`,
  }));
}

/**
 * Get all category slugs for static generation
 */
export async function getAllCategorySlugs(): Promise<string[]> {
  const cats = await getCategories();
  return cats.map((c) => c.slug);
}

/**
 * Get category by slug in WPCategory format
 */
export async function getCategoryBySlugForPage(slug: string): Promise<WPCategory | null> {
  const cat = await getCategoryBySlug(slug);
  if (!cat) return null;

  return {
    id: 1,
    count: cat.count || 0,
    name: cat.name,
    slug: cat.slug,
    description: cat.description || undefined,
    link: `https://cursedtours.com/category/${cat.slug}`,
  };
}

// ============================================================
// SEARCH FUNCTIONALITY
// ============================================================

/**
 * Search posts by query string (searches title and content)
 */
export async function searchPosts(options: {
  query: string;
  limit?: number;
  offset?: number;
}): Promise<{ posts: PostWithRelations[]; total: number }> {
  const { query, limit = 20, offset = 0 } = options;
  
  if (!query.trim()) {
    return { posts: [], total: 0 };
  }

  // Use ILIKE for case-insensitive search on title and content
  const searchPattern = `%${query.trim()}%`;

  const result = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.status, "published"),
        sql`(${posts.title} ILIKE ${searchPattern} OR ${posts.content} ILIKE ${searchPattern})`
      )
    )
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(
      and(
        eq(posts.status, "published"),
        sql`(${posts.title} ILIKE ${searchPattern} OR ${posts.content} ILIKE ${searchPattern})`
      )
    );

  const postsWithRelations = await addRelationsToPost(result);

  return {
    posts: postsWithRelations,
    total: Number(countResult[0]?.count || 0),
  };
}

/**
 * Search posts and return in WPPost format
 */
export async function searchPostsForPage(options: {
  query: string;
  perPage?: number;
  page?: number;
}): Promise<{ posts: WPPost[]; totalPages: number; totalPosts: number }> {
  const { query, perPage = 20, page = 1 } = options;
  const offset = (page - 1) * perPage;

  const result = await searchPosts({
    query,
    limit: perPage,
    offset,
  });

  return {
    posts: result.posts.map(toWPPost),
    totalPages: Math.ceil(result.total / perPage),
    totalPosts: result.total,
  };
}

// ============================================================
// SITEMAP DATA FUNCTIONS
// ============================================================

/**
 * Get all posts for sitemap (minimal data)
 */
export async function getAllPostsForSitemap(): Promise<Array<{ slug: string; modified: Date }>> {
  const result = await db
    .select({
      slug: posts.slug,
      modified: posts.updatedAt,
    })
    .from(posts)
    .where(eq(posts.status, "published"));

  return result.map(r => ({
    slug: r.slug,
    modified: r.modified,
  }));
}

/**
 * Get all categories for sitemap
 */
export async function getAllCategoriesForSitemap(): Promise<Array<{ slug: string; count: number }>> {
  const cats = await getCategories();
  return cats
    .filter(c => (c.count || 0) > 0)
    .map(c => ({
      slug: c.slug,
      count: c.count || 0,
    }));
}
