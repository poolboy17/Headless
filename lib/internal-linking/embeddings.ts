/**
 * Embedding Service
 * Generates and manages OpenAI embeddings for posts
 */

import OpenAI from 'openai';
import { createHash } from 'crypto';
import { LINKING_CONFIG } from './config';

// Lazy initialization to allow runtime API key check
let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set. Add it in Vercel Environment Variables.');
    }
    _openai = new OpenAI({ apiKey });
  }
  return _openai;
}

export type PostForEmbedding = {
  id: string;
  title: string;
  content: string;
  excerpt?: string | null;
  categories?: string[];
};

/**
 * Generate embedding for a single post
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAI();
  const response = await openai.embeddings.create({
    model: LINKING_CONFIG.EMBEDDING_MODEL,
    input: prepareText(text),
    dimensions: LINKING_CONFIG.EMBEDDING_DIMENSIONS,
  });
  
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple posts in batch
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const openai = getOpenAI();
  const prepared = texts.map(prepareText);
  
  const response = await openai.embeddings.create({
    model: LINKING_CONFIG.EMBEDDING_MODEL,
    input: prepared,
    dimensions: LINKING_CONFIG.EMBEDDING_DIMENSIONS,
  });
  
  return response.data.map(item => item.embedding);
}

/**
 * Create optimized text for embedding from post data
 */
export function createEmbeddingText(post: PostForEmbedding): string {
  const parts: string[] = [];
  
  // Title is most important - add twice for emphasis
  parts.push(`Title: ${post.title}`);
  parts.push(post.title);
  
  // Categories for topic context
  if (post.categories?.length) {
    parts.push(`Topics: ${post.categories.join(', ')}`);
  }
  
  // Excerpt
  if (post.excerpt) {
    parts.push(`Summary: ${stripHtml(post.excerpt)}`);
  }
  
  // Main content (stripped of HTML)
  parts.push(stripHtml(post.content));
  
  return parts.join('\n\n');
}

/**
 * Prepare text for embedding (clean and truncate)
 */
function prepareText(text: string, maxChars: number = 25000): string {
  // Normalize whitespace
  let cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Truncate if needed (rough estimate: 4 chars per token)
  if (cleaned.length > maxChars) {
    cleaned = cleaned.slice(0, maxChars);
  }
  
  return cleaned;
}

/**
 * Strip HTML tags from content
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate MD5 hash of content to detect changes
 */
export function contentHash(content: string): string {
  return createHash('md5').update(content).digest('hex');
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find most similar posts to a query embedding
 */
export function findSimilarPosts(
  queryEmbedding: number[],
  allEmbeddings: Array<{ postId: string; slug: string; title: string; embedding: number[] }>,
  excludeIds: Set<string> = new Set(),
  topK: number = 15,
  minSimilarity: number = LINKING_CONFIG.MIN_SIMILARITY
): Array<{ postId: string; slug: string; title: string; similarity: number }> {
  const results: Array<{ postId: string; slug: string; title: string; similarity: number }> = [];
  
  for (const item of allEmbeddings) {
    if (excludeIds.has(item.postId)) continue;
    
    const similarity = cosineSimilarity(queryEmbedding, item.embedding);
    
    if (similarity >= minSimilarity) {
      results.push({
        postId: item.postId,
        slug: item.slug,
        title: item.title,
        similarity,
      });
    }
  }
  
  // Sort by similarity descending
  results.sort((a, b) => b.similarity - a.similarity);
  
  return results.slice(0, topK);
}
