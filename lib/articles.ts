import { db, articles, articleFaqs, destinations, type Article, type NewArticle, type ArticleFaq, type NewArticleFaq } from "./db";
import { eq, desc, and, ilike, sql } from "drizzle-orm";

// ============================================================
// ARTICLE QUERIES
// ============================================================

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const result = await db
    .select()
    .from(articles)
    .where(and(eq(articles.slug, slug), eq(articles.status, "published")))
    .limit(1);

  return result[0] || null;
}

export async function getArticleByProductCode(productCode: string): Promise<Article | null> {
  const result = await db
    .select()
    .from(articles)
    .where(eq(articles.productCode, productCode))
    .limit(1);

  return result[0] || null;
}

export async function getPublishedArticles(options: {
  limit?: number;
  offset?: number;
  destination?: string;
  articleType?: string;
  niche?: string;
} = {}): Promise<{ articles: Article[]; total: number }> {
  const { limit = 20, offset = 0, destination, articleType, niche } = options;

  const conditions = [eq(articles.status, "published")];

  if (destination) {
    conditions.push(ilike(articles.destination, `%${destination}%`));
  }
  if (articleType) {
    conditions.push(eq(articles.articleType, articleType));
  }
  if (niche) {
    conditions.push(eq(articles.niche, niche));
  }

  const [result, countResult] = await Promise.all([
    db
      .select()
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .where(and(...conditions)),
  ]);

  return {
    articles: result,
    total: Number(countResult[0]?.count || 0),
  };
}

export async function getArticlesByDestination(
  destination: string,
  limit: number = 10
): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(
      and(
        ilike(articles.destination, `%${destination}%`),
        eq(articles.status, "published")
      )
    )
    .orderBy(desc(articles.rating))
    .limit(limit);
}

export async function getTopRatedArticles(
  limit: number = 10,
  minRating: number = 4.5
): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        sql`${articles.rating} >= ${minRating}`
      )
    )
    .orderBy(desc(articles.rating), desc(articles.reviewCount))
    .limit(limit);
}

export async function getRecentArticles(limit: number = 10): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(eq(articles.status, "published"))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const result = await db
    .select({ slug: articles.slug })
    .from(articles)
    .where(eq(articles.status, "published"));

  return result.map((r) => r.slug);
}

// ============================================================
// ARTICLE MUTATIONS
// ============================================================

export async function createArticle(data: NewArticle): Promise<Article> {
  const result = await db.insert(articles).values(data).returning();
  return result[0];
}

export async function updateArticle(
  id: string,
  data: Partial<NewArticle>
): Promise<Article | null> {
  const result = await db
    .update(articles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(articles.id, id))
    .returning();

  return result[0] || null;
}

export async function publishArticle(id: string): Promise<Article | null> {
  return updateArticle(id, {
    status: "published",
    publishedAt: new Date(),
  });
}

export async function upsertArticle(data: NewArticle): Promise<Article> {
  // Check if article exists by product code
  const existing = await getArticleByProductCode(data.productCode);

  if (existing) {
    const updated = await updateArticle(existing.id, data);
    return updated!;
  }

  return createArticle(data);
}

// ============================================================
// FAQ QUERIES
// ============================================================

export async function getArticleFaqs(articleId: string): Promise<ArticleFaq[]> {
  return db
    .select()
    .from(articleFaqs)
    .where(eq(articleFaqs.articleId, articleId))
    .orderBy(articleFaqs.sortOrder);
}

export async function createArticleFaq(data: NewArticleFaq): Promise<ArticleFaq> {
  const result = await db.insert(articleFaqs).values(data).returning();
  return result[0];
}

export async function createArticleFaqs(
  articleId: string,
  faqs: Array<{ question: string; answer: string }>
): Promise<ArticleFaq[]> {
  if (faqs.length === 0) return [];

  const faqData = faqs.map((faq, index) => ({
    articleId,
    question: faq.question,
    answer: faq.answer,
    sortOrder: index,
  }));

  return db.insert(articleFaqs).values(faqData).returning();
}

// ============================================================
// DESTINATION QUERIES
// ============================================================

export async function getDestinations(): Promise<typeof destinations.$inferSelect[]> {
  return db
    .select()
    .from(destinations)
    .orderBy(desc(destinations.tourCount));
}

export async function getDestinationBySlug(
  slug: string
): Promise<typeof destinations.$inferSelect | null> {
  const result = await db
    .select()
    .from(destinations)
    .where(eq(destinations.slug, slug))
    .limit(1);

  return result[0] || null;
}

// ============================================================
// STATS
// ============================================================

export async function getArticleStats(): Promise<{
  total: number;
  published: number;
  draft: number;
  byDestination: { destination: string; count: number }[];
}> {
  const [totalResult, publishedResult, draftResult, byDestinationResult] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(articles),
      db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(eq(articles.status, "published")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .where(eq(articles.status, "draft")),
      db
        .select({
          destination: articles.destination,
          count: sql<number>`count(*)`,
        })
        .from(articles)
        .where(eq(articles.status, "published"))
        .groupBy(articles.destination)
        .orderBy(desc(sql`count(*)`))
        .limit(20),
    ]);

  return {
    total: Number(totalResult[0]?.count || 0),
    published: Number(publishedResult[0]?.count || 0),
    draft: Number(draftResult[0]?.count || 0),
    byDestination: byDestinationResult.map((r) => ({
      destination: r.destination || "Unknown",
      count: Number(r.count),
    })),
  };
}

// ============================================================
// SEARCH
// ============================================================

export async function searchArticles(
  query: string,
  limit: number = 20
): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(
      and(
        eq(articles.status, "published"),
        sql`(
          ${articles.title} ILIKE ${"%" + query + "%"} OR
          ${articles.destination} ILIKE ${"%" + query + "%"} OR
          ${articles.excerpt} ILIKE ${"%" + query + "%"}
        )`
      )
    )
    .orderBy(desc(articles.rating))
    .limit(limit);
}

// ============================================================
// HELPERS
// ============================================================

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 200);
}

export function generateFaqSchema(faqs: ArticleFaq[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
