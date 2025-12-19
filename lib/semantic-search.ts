import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";

const sql = neon(process.env.DATABASE_URL!);

// OpenAI embedding model config
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  // Clean and truncate text (max ~8000 tokens ≈ 32000 chars)
  const cleanText = text
    .replace(/<[^>]*>/g, " ") // Strip HTML
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .slice(0, 32000);

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: cleanText,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Hash content to detect changes
 */
export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 64);
}

/**
 * Search posts using semantic similarity
 */
export async function semanticSearch(
  query: string,
  options: {
    limit?: number;
    threshold?: number;
    includeKeyword?: boolean;
  } = {}
): Promise<SearchResult[]> {
  const { limit = 10, threshold = 0.5, includeKeyword = true } = options;

  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(",")}]`;

  // Hybrid search: combine semantic + keyword
  let results: SearchResult[];

  if (includeKeyword) {
    // Hybrid search with keyword boost
    const searchPattern = `%${query.toLowerCase()}%`;
    
    results = await sql`
      WITH semantic AS (
        SELECT 
          p.id,
          p.slug,
          p.title,
          p.excerpt,
          p.featured_image_url,
          p.published_at,
          1 - (pe.embedding <=> ${embeddingStr}::vector) AS semantic_score,
          0 AS keyword_score
        FROM post_embeddings pe
        JOIN posts p ON pe.post_id = p.id
        WHERE p.status = 'published'
          AND 1 - (pe.embedding <=> ${embeddingStr}::vector) > ${threshold}
      ),
      keyword AS (
        SELECT 
          p.id,
          p.slug,
          p.title,
          p.excerpt,
          p.featured_image_url,
          p.published_at,
          0 AS semantic_score,
          CASE 
            WHEN LOWER(p.title) LIKE ${searchPattern} THEN 0.3
            WHEN LOWER(p.excerpt) LIKE ${searchPattern} THEN 0.2
            WHEN LOWER(p.content) LIKE ${searchPattern} THEN 0.1
            ELSE 0
          END AS keyword_score
        FROM posts p
        WHERE p.status = 'published'
          AND (
            LOWER(p.title) LIKE ${searchPattern}
            OR LOWER(p.excerpt) LIKE ${searchPattern}
            OR LOWER(p.content) LIKE ${searchPattern}
          )
      ),
      combined AS (
        SELECT 
          COALESCE(s.id, k.id) AS id,
          COALESCE(s.slug, k.slug) AS slug,
          COALESCE(s.title, k.title) AS title,
          COALESCE(s.excerpt, k.excerpt) AS excerpt,
          COALESCE(s.featured_image_url, k.featured_image_url) AS featured_image_url,
          COALESCE(s.published_at, k.published_at) AS published_at,
          COALESCE(s.semantic_score, 0) + COALESCE(k.keyword_score, 0) AS score
        FROM semantic s
        FULL OUTER JOIN keyword k ON s.id = k.id
      )
      SELECT DISTINCT ON (id)
        id,
        slug,
        title,
        excerpt,
        featured_image_url,
        published_at,
        score
      FROM combined
      ORDER BY id, score DESC
      LIMIT ${limit}
    `;
    
    // Sort by score after deduplication
    results = results.sort((a, b) => (b.score || 0) - (a.score || 0));
  } else {
    // Pure semantic search
    results = await sql`
      SELECT 
        p.id,
        p.slug,
        p.title,
        p.excerpt,
        p.featured_image_url,
        p.published_at,
        1 - (pe.embedding <=> ${embeddingStr}::vector) AS score
      FROM post_embeddings pe
      JOIN posts p ON pe.post_id = p.id
      WHERE p.status = 'published'
        AND 1 - (pe.embedding <=> ${embeddingStr}::vector) > ${threshold}
      ORDER BY pe.embedding <=> ${embeddingStr}::vector
      LIMIT ${limit}
    `;
  }

  return results;
}

/**
 * Get posts that need embeddings (new or updated)
 */
export async function getPostsNeedingEmbeddings(): Promise<PostForEmbedding[]> {
  const results = await sql`
    SELECT 
      p.id,
      p.slug,
      p.title,
      p.content,
      p.excerpt,
      pe.content_hash AS existing_hash
    FROM posts p
    LEFT JOIN post_embeddings pe ON p.id = pe.post_id
    WHERE p.status = 'published'
    ORDER BY p.published_at DESC
  `;
  
  return results as PostForEmbedding[];
}

/**
 * Upsert embedding for a post
 */
export async function upsertEmbedding(
  postId: string,
  embedding: number[],
  contentHash: string
): Promise<void> {
  const embeddingStr = `[${embedding.join(",")}]`;
  
  await sql`
    INSERT INTO post_embeddings (post_id, embedding, content_hash, model, updated_at)
    VALUES (${postId}, ${embeddingStr}::vector, ${contentHash}, ${EMBEDDING_MODEL}, NOW())
    ON CONFLICT (post_id) 
    DO UPDATE SET 
      embedding = ${embeddingStr}::vector,
      content_hash = ${contentHash},
      model = ${EMBEDDING_MODEL},
      updated_at = NOW()
  `;
}

/**
 * Check if pgvector extension is enabled
 */
export async function checkPgvectorEnabled(): Promise<boolean> {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) AS enabled
    `;
    return result[0]?.enabled === true;
  } catch {
    return false;
  }
}

// Types
export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featured_image_url: string | null;
  published_at: Date | null;
  score: number;
}

export interface PostForEmbedding {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  existing_hash: string | null;
}
