#!/usr/bin/env npx tsx
/**
 * Generate embeddings for all posts
 * 
 * Usage:
 *   npx tsx scripts/generate-embeddings.ts
 *   npx tsx scripts/generate-embeddings.ts --force  # Re-embed all posts
 *   npx tsx scripts/generate-embeddings.ts --dry-run  # Show what would be embedded
 * 
 * Required env vars:
 *   DATABASE_URL - Neon PostgreSQL connection string
 *   OPENAI_API_KEY - OpenAI API key for embeddings
 */

import { neon } from "@neondatabase/serverless";
import { createHash } from "crypto";
import * as dotenv from "dotenv";

// Load env vars
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 10;
const RATE_LIMIT_DELAY = 200; // ms between API calls

// Parse args
const args = process.argv.slice(2);
const forceReembed = args.includes("--force");
const dryRun = args.includes("--dry-run");

async function main() {
  console.log("🔮 Cursed Tours Embedding Generator\n");

  // Check env vars
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not set");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is not set");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  // Check pgvector extension
  console.log("📡 Checking pgvector extension...");
  const extCheck = await sql`
    SELECT EXISTS (
      SELECT 1 FROM pg_extension WHERE extname = 'vector'
    ) AS enabled
  `;
  
  if (!extCheck[0]?.enabled) {
    console.log("⚠️  pgvector not enabled. Run this in Neon SQL Editor:\n");
    console.log("   CREATE EXTENSION IF NOT EXISTS vector;\n");
    console.log("Then run the migration in migrations/add-embeddings.sql");
    process.exit(1);
  }
  console.log("✅ pgvector is enabled\n");

  // Check if embeddings table exists
  const tableCheck = await sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'post_embeddings'
    ) AS exists
  `;

  if (!tableCheck[0]?.exists) {
    console.log("⚠️  post_embeddings table doesn't exist.");
    console.log("Run the migration in migrations/add-embeddings.sql first.\n");
    process.exit(1);
  }

  // Get all posts
  console.log("📚 Fetching posts...");
  const posts = await sql`
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

  console.log(`   Found ${posts.length} published posts\n`);

  // Filter posts needing embeddings
  const postsToEmbed: typeof posts = [];
  let skipped = 0;

  for (const post of posts) {
    const contentForEmbedding = `${post.title}\n\n${stripHtml(post.excerpt || "")}\n\n${stripHtml(post.content)}`;
    const contentHash = hashContent(contentForEmbedding);

    if (!forceReembed && post.existing_hash === contentHash) {
      skipped++;
      continue;
    }

    postsToEmbed.push({ ...post, contentHash, contentForEmbedding });
  }

  console.log(`📊 Status:`);
  console.log(`   • ${skipped} posts already embedded (unchanged)`);
  console.log(`   • ${postsToEmbed.length} posts need embedding\n`);

  if (postsToEmbed.length === 0) {
    console.log("✅ All posts are up to date!");
    return;
  }

  if (dryRun) {
    console.log("🔍 Dry run - would embed these posts:\n");
    for (const post of postsToEmbed.slice(0, 20)) {
      console.log(`   • ${post.slug}`);
    }
    if (postsToEmbed.length > 20) {
      console.log(`   ... and ${postsToEmbed.length - 20} more`);
    }
    return;
  }

  // Estimate cost
  const totalChars = postsToEmbed.reduce(
    (sum, p) => sum + (p.contentForEmbedding?.length || 0),
    0
  );
  const estimatedTokens = totalChars / 4;
  const estimatedCost = (estimatedTokens / 1_000_000) * 0.02; // $0.02 per 1M tokens
  console.log(`💰 Estimated cost: $${estimatedCost.toFixed(4)}\n`);

  // Generate embeddings
  console.log("🚀 Generating embeddings...\n");
  let processed = 0;
  let errors = 0;

  for (const post of postsToEmbed) {
    try {
      process.stdout.write(`   [${processed + 1}/${postsToEmbed.length}] ${post.slug.slice(0, 50)}...`);

      const embedding = await generateEmbedding(post.contentForEmbedding);
      const embeddingStr = `[${embedding.join(",")}]`;

      await sql`
        INSERT INTO post_embeddings (post_id, embedding, content_hash, model, updated_at)
        VALUES (${post.id}, ${embeddingStr}::vector, ${post.contentHash}, ${EMBEDDING_MODEL}, NOW())
        ON CONFLICT (post_id) 
        DO UPDATE SET 
          embedding = ${embeddingStr}::vector,
          content_hash = ${post.contentHash},
          model = ${EMBEDDING_MODEL},
          updated_at = NOW()
      `;

      console.log(" ✅");
      processed++;

      // Rate limiting
      await sleep(RATE_LIMIT_DELAY);
    } catch (error) {
      console.log(` ❌ ${error}`);
      errors++;
    }
  }

  console.log(`\n🎉 Done!`);
  console.log(`   • ${processed} posts embedded successfully`);
  if (errors > 0) {
    console.log(`   • ${errors} errors`);
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const cleanText = text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 32000);

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: cleanText,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 64);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
