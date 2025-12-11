/**
 * Autonomous Internal Linking Processor
 * Runs automatically via cron/Vercel to maintain internal links
 */

import { db } from '@/lib/db';
import { posts, postEmbeddings, internalLinks, linkingLog, postCategories, categories } from '@/shared/schema';
import { eq, sql, and, isNull, desc } from 'drizzle-orm';
import { 
  generateEmbedding, 
  generateEmbeddingsBatch, 
  createEmbeddingText, 
  contentHash,
  findSimilarPosts,
  stripHtml 
} from './embeddings';
import { findAnchorOpportunities, insertLinks } from './linker';
import { LINKING_CONFIG } from './config';

export type ProcessingResult = {
  processed: number;
  embedded: number;
  linked: number;
  errors: string[];
  migrated?: boolean;
};


/**
 * Ensure required tables exist (auto-migration)
 */
async function ensureTablesExist(): Promise<boolean> {
  try {
    // Check if post_embeddings table exists by querying it
    await db.select({ count: sql`1` }).from(postEmbeddings).limit(1);
    return false; // Tables already exist
  } catch (error: any) {
    // Table doesn't exist, create it
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      console.log('[Internal Linking] Creating tables...');
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS post_embeddings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID UNIQUE NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          embedding TEXT NOT NULL,
          content_hash VARCHAR(32),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS internal_links (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          target_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
          anchor_text TEXT NOT NULL,
          position INTEGER,
          similarity DECIMAL(4,3),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS linking_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
          action VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL,
          message TEXT,
          links_added INTEGER DEFAULT 0,
          processed_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      
      await db.execute(sql`CREATE INDEX IF NOT EXISTS post_embeddings_post_idx ON post_embeddings(post_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS internal_links_source_idx ON internal_links(source_post_id)`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS internal_links_target_idx ON internal_links(target_post_id)`);
      
      console.log('[Internal Linking] Tables created successfully');
      return true;
    }
    throw error;
  }
}


/**
 * MAIN ENTRY POINT - Process all posts that need linking
 */
export async function processAllPosts(): Promise<ProcessingResult> {
  const result: ProcessingResult = { processed: 0, embedded: 0, linked: 0, errors: [] };
  
  try {
    // Step 0: Ensure tables exist (auto-migration)
    result.migrated = await ensureTablesExist();
    
    // Step 1: Find posts needing embeddings
    const postsNeedingEmbeddings = await findPostsNeedingEmbeddings();
    console.log(`Found ${postsNeedingEmbeddings.length} posts needing embeddings`);
    
    // Step 2: Generate embeddings in batches
    if (postsNeedingEmbeddings.length > 0) {
      const embedded = await generateAllEmbeddings(postsNeedingEmbeddings);
      result.embedded = embedded;
    }
    
    // Step 3: Find posts needing links
    const postsNeedingLinks = await findPostsNeedingLinks();
    console.log(`Found ${postsNeedingLinks.length} posts needing links`);
    
    // Step 4: Insert links for each post
    if (postsNeedingLinks.length > 0) {
      const linked = await insertLinksForPosts(postsNeedingLinks);
      result.linked = linked;
    }
    
    result.processed = postsNeedingEmbeddings.length + postsNeedingLinks.length;
    
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(msg);
    await logAction(null, 'process_all', 'error', msg);
  }
  
  return result;
}


/**
 * Find posts without embeddings or with stale embeddings
 */
async function findPostsNeedingEmbeddings() {
  // Get all published posts with their current embedding status
  const allPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      excerpt: posts.excerpt,
      currentHash: postEmbeddings.contentHash,
    })
    .from(posts)
    .leftJoin(postEmbeddings, eq(posts.id, postEmbeddings.postId))
    .where(eq(posts.status, 'published'));
  
  // Filter to posts needing new/updated embeddings
  return allPosts.filter(post => {
    const newHash = contentHash(post.content);
    return !post.currentHash || post.currentHash !== newHash;
  });
}

/**
 * Generate embeddings for posts in batches
 */
async function generateAllEmbeddings(
  postsToEmbed: Array<{ id: string; title: string; content: string; excerpt: string | null }>
): Promise<number> {
  let count = 0;
  
  for (let i = 0; i < postsToEmbed.length; i += LINKING_CONFIG.BATCH_SIZE) {
    const batch = postsToEmbed.slice(i, i + LINKING_CONFIG.BATCH_SIZE);
    
    try {
      // Get categories for each post in batch
      const postIds = batch.map(p => p.id);
      const categoriesData = await db
        .select({ postId: postCategories.postId, name: categories.name })
        .from(postCategories)
        .innerJoin(categories, eq(postCategories.categoryId, categories.id))
        .where(sql`${postCategories.postId} IN ${postIds}`);
      
      const categoryMap = new Map<string, string[]>();
      for (const c of categoriesData) {
        if (!categoryMap.has(c.postId)) categoryMap.set(c.postId, []);
        categoryMap.get(c.postId)!.push(c.name);
      }
      
      // Create embedding texts
      const texts = batch.map(post => createEmbeddingText({
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        categories: categoryMap.get(post.id) || [],
      }));
      
      // Generate embeddings via OpenAI
      const embeddings = await generateEmbeddingsBatch(texts);
      
      // Store in database
      for (let j = 0; j < batch.length; j++) {
        const post = batch[j];
        const embedding = embeddings[j];
        const hash = contentHash(post.content);
        
        await db
          .insert(postEmbeddings)
          .values({
            postId: post.id,
            embedding: JSON.stringify(embedding),
            contentHash: hash,
          })
          .onConflictDoUpdate({
            target: postEmbeddings.postId,
            set: {
              embedding: JSON.stringify(embedding),
              contentHash: hash,
              updatedAt: new Date(),
            },
          });
        
        count++;
      }
      
      await logAction(null, 'embed_batch', 'success', `Embedded ${batch.length} posts`);
      
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Embedding batch failed';
      await logAction(null, 'embed_batch', 'error', msg);
    }
  }
  
  return count;
}


/**
 * Find posts that need internal links added
 */
async function findPostsNeedingLinks() {
  // Get posts with their link counts
  const postsWithLinkCounts = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      content: posts.content,
      linkCount: sql<number>`COALESCE((
        SELECT COUNT(*) FROM internal_links 
        WHERE source_post_id = ${posts.id}
      ), 0)`,
    })
    .from(posts)
    .where(eq(posts.status, 'published'));
  
  // Filter to posts below minimum links
  return postsWithLinkCounts.filter(
    post => Number(post.linkCount) < LINKING_CONFIG.MIN_LINKS_PER_POST
  );
}


/**
 * Insert links for posts that need them
 */
async function insertLinksForPosts(
  postsNeedingLinks: Array<{ id: string; slug: string; title: string; content: string }>
): Promise<number> {
  let totalLinked = 0;
  
  // Load all embeddings for similarity search
  const allEmbeddings = await loadAllEmbeddings();
  
  for (const post of postsNeedingLinks) {
    try {
      // Get this post's embedding
      const postEmb = allEmbeddings.find(e => e.postId === post.id);
      if (!postEmb) {
        await logAction(post.id, 'link', 'skipped', 'No embedding found');
        continue;
      }
      
      // Find similar posts
      const similar = findSimilarPosts(
        postEmb.embedding,
        allEmbeddings,
        new Set([post.id]) // Exclude self
      );
      
      if (similar.length === 0) {
        await logAction(post.id, 'link', 'skipped', 'No similar posts found');
        continue;
      }
      
      // Find anchor opportunities
      const candidates = findAnchorOpportunities(post.content, similar);
      
      if (candidates.length === 0) {
        await logAction(post.id, 'link', 'skipped', 'No anchor opportunities');
        continue;
      }
      
      // Insert links
      const { content: newContent, insertions } = insertLinks(post.content, candidates);
      
      if (insertions.length === 0) {
        await logAction(post.id, 'link', 'skipped', 'No valid insertions');
        continue;
      }
      
      // Update post content in database
      await db
        .update(posts)
        .set({ content: newContent, updatedAt: new Date() })
        .where(eq(posts.id, post.id));
      
      // Record links in tracking table
      for (const insertion of insertions) {
        await db.insert(internalLinks).values({
          sourcePostId: post.id,
          targetPostId: insertion.targetPostId,
          anchorText: insertion.anchorText,
          position: insertion.position,
          similarity: insertion.similarity.toString(),
        });
      }
      
      totalLinked += insertions.length;
      await logAction(post.id, 'link', 'success', `Added ${insertions.length} links`, insertions.length);
      
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Link insertion failed';
      await logAction(post.id, 'link', 'error', msg);
    }
  }
  
  return totalLinked;
}


/**
 * Load all embeddings with post data for similarity search
 */
async function loadAllEmbeddings() {
  const results = await db
    .select({
      postId: postEmbeddings.postId,
      embedding: postEmbeddings.embedding,
      slug: posts.slug,
      title: posts.title,
    })
    .from(postEmbeddings)
    .innerJoin(posts, eq(postEmbeddings.postId, posts.id))
    .where(eq(posts.status, 'published'));
  
  return results.map(r => ({
    postId: r.postId,
    slug: r.slug,
    title: r.title,
    embedding: JSON.parse(r.embedding) as number[],
  }));
}

/**
 * Log action to database
 */
async function logAction(
  postId: string | null,
  action: string,
  status: string,
  message?: string,
  linksAdded?: number
) {
  await db.insert(linkingLog).values({
    postId,
    action,
    status,
    message,
    linksAdded: linksAdded || 0,
  });
}


/**
 * Get linking statistics
 */
export async function getLinkingStats() {
  const [totalPosts] = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(eq(posts.status, 'published'));
  
  const [totalEmbeddings] = await db
    .select({ count: sql<number>`count(*)` })
    .from(postEmbeddings);
  
  const [totalLinks] = await db
    .select({ count: sql<number>`count(*)` })
    .from(internalLinks);
  
  const orphans = await db
    .select({ id: posts.id, slug: posts.slug, title: posts.title })
    .from(posts)
    .leftJoin(internalLinks, eq(posts.id, internalLinks.targetPostId))
    .where(and(
      eq(posts.status, 'published'),
      isNull(internalLinks.id)
    ));
  
  const avgLinksResult = await db
    .select({
      sourcePostId: internalLinks.sourcePostId,
      count: sql<number>`count(*)`,
    })
    .from(internalLinks)
    .groupBy(internalLinks.sourcePostId);
  
  const avgLinks = avgLinksResult.length > 0
    ? avgLinksResult.reduce((sum, r) => sum + Number(r.count), 0) / avgLinksResult.length
    : 0;
  
  return {
    totalPosts: Number(totalPosts.count),
    totalEmbeddings: Number(totalEmbeddings.count),
    totalLinks: Number(totalLinks.count),
    orphanCount: orphans.length,
    orphans: orphans.slice(0, 20), // First 20
    avgLinksPerPost: Math.round(avgLinks * 10) / 10,
  };
}

/**
 * Process a single new post (call after publishing)
 */
export async function processNewPost(postId: string): Promise<{ success: boolean; linksAdded: number; error?: string }> {
  try {
    // Get the post
    const [post] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, postId));
    
    if (!post) {
      return { success: false, linksAdded: 0, error: 'Post not found' };
    }
    
    // Generate embedding
    const postCats = await db
      .select({ name: categories.name })
      .from(postCategories)
      .innerJoin(categories, eq(postCategories.categoryId, categories.id))
      .where(eq(postCategories.postId, postId));
    
    const text = createEmbeddingText({
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      categories: postCats.map(c => c.name),
    });
    
    const embedding = await generateEmbedding(text);
    const hash = contentHash(post.content);
    
    await db
      .insert(postEmbeddings)
      .values({
        postId: post.id,
        embedding: JSON.stringify(embedding),
        contentHash: hash,
      })
      .onConflictDoUpdate({
        target: postEmbeddings.postId,
        set: { embedding: JSON.stringify(embedding), contentHash: hash, updatedAt: new Date() },
      });
    
    // Find and insert links
    const allEmbeddings = await loadAllEmbeddings();
    const similar = findSimilarPosts(embedding, allEmbeddings, new Set([postId]));
    const candidates = findAnchorOpportunities(post.content, similar);
    const { content: newContent, insertions } = insertLinks(post.content, candidates);
    
    if (insertions.length > 0) {
      await db.update(posts).set({ content: newContent }).where(eq(posts.id, postId));
      
      for (const ins of insertions) {
        await db.insert(internalLinks).values({
          sourcePostId: postId,
          targetPostId: ins.targetPostId,
          anchorText: ins.anchorText,
          position: ins.position,
          similarity: ins.similarity.toString(),
        });
      }
    }
    
    await logAction(postId, 'new_post', 'success', `Processed new post, added ${insertions.length} links`, insertions.length);
    
    return { success: true, linksAdded: insertions.length };
    
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await logAction(postId, 'new_post', 'error', msg);
    return { success: false, linksAdded: 0, error: msg };
  }
}
