import { db, posts, categories, authors, postCategories } from "./db";
import type { Post, Category, Author } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

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
} = {}): Promise<{ posts: PostWithRelations[]; total: number }> {
  const { limit = 10, offset = 0, categorySlug } = options;

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
