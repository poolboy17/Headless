/**
 * WordPress to Neon Database Migration Script
 *
 * Run with: npx tsx scripts/migrate-wordpress.ts
 */

import { neon } from "@neondatabase/serverless";

const WP_API_URL = "https://wp.cursedtours.com/wp-json/wp/v2";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Strip HTML tags and decode entities
function stripHtml(html: string): string {
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

// Calculate reading time
function getReadingTime(content: string): number {
  const text = stripHtml(content);
  const words = text.split(/\s+/).length;
  return Math.ceil(words / 200);
}

// Fetch all pages from WordPress API
async function fetchAllPages<T>(endpoint: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    console.log(`  Fetching page ${page}...`);
    const response = await fetch(
      `${WP_API_URL}${endpoint}?per_page=${perPage}&page=${page}&_embed=true`
    );

    if (!response.ok) {
      if (response.status === 400) break; // No more pages
      throw new Error(`API error: ${response.status}`);
    }

    const data: T[] = await response.json();
    if (data.length === 0) break;

    items.push(...data);

    const totalPages = parseInt(response.headers.get("X-WP-TotalPages") || "1");
    if (page >= totalPages) break;
    page++;
  }

  return items;
}

// Migrate categories
async function migrateCategories(): Promise<Map<number, string>> {
  console.log("\n📁 Migrating categories...");
  const wpIdToUuid = new Map<number, string>();

  const categories = await fetchAllPages<{
    id: number;
    slug: string;
    name: string;
    description: string;
    count: number;
  }>("/categories");

  console.log(`  Found ${categories.length} categories`);

  for (const cat of categories) {
    try {
      const result = await sql`
        INSERT INTO categories (wp_id, slug, name, description, count)
        VALUES (${cat.id}, ${cat.slug}, ${stripHtml(cat.name)}, ${cat.description || null}, ${cat.count})
        ON CONFLICT (wp_id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          count = EXCLUDED.count
        RETURNING id
      `;
      wpIdToUuid.set(cat.id, result[0].id);
      console.log(`  ✓ ${cat.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate category ${cat.name}:`, error);
    }
  }

  return wpIdToUuid;
}

// Migrate authors
async function migrateAuthors(): Promise<Map<number, string>> {
  console.log("\n👤 Migrating authors...");
  const wpIdToUuid = new Map<number, string>();

  const authors = await fetchAllPages<{
    id: number;
    slug: string;
    name: string;
    description: string;
    avatar_urls?: Record<string, string>;
  }>("/users");

  console.log(`  Found ${authors.length} authors`);

  for (const author of authors) {
    try {
      const avatarUrl = author.avatar_urls?.["96"] || author.avatar_urls?.["48"] || null;
      const result = await sql`
        INSERT INTO authors (wp_id, slug, name, description, avatar_url)
        VALUES (${author.id}, ${author.slug}, ${author.name}, ${author.description || null}, ${avatarUrl})
        ON CONFLICT (wp_id) DO UPDATE SET
          slug = EXCLUDED.slug,
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          avatar_url = EXCLUDED.avatar_url
        RETURNING id
      `;
      wpIdToUuid.set(author.id, result[0].id);
      console.log(`  ✓ ${author.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate author ${author.name}:`, error);
    }
  }

  return wpIdToUuid;
}

// Migrate posts
async function migratePosts(
  authorMap: Map<number, string>,
  categoryMap: Map<number, string>
): Promise<void> {
  console.log("\n📝 Migrating posts...");

  const posts = await fetchAllPages<{
    id: number;
    slug: string;
    status: string;
    date: string;
    modified: string;
    title: { rendered: string };
    content: { rendered: string };
    excerpt: { rendered: string };
    author: number;
    categories: number[];
    _embedded?: {
      "wp:featuredmedia"?: Array<{
        source_url: string;
        alt_text?: string;
      }>;
    };
  }>("/posts");

  console.log(`  Found ${posts.length} posts`);

  for (const post of posts) {
    try {
      const authorId = authorMap.get(post.author) || null;
      const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
      const content = post.content.rendered;
      const wordCount = stripHtml(content).split(/\s+/).length;
      const readingTime = getReadingTime(content);

      // Insert post
      const result = await sql`
        INSERT INTO posts (
          wp_id, slug, title, content, excerpt, author_id,
          featured_image_url, featured_image_alt, status,
          created_at, updated_at, published_at,
          word_count, reading_time_minutes
        )
        VALUES (
          ${post.id},
          ${post.slug},
          ${stripHtml(post.title.rendered)},
          ${content},
          ${stripHtml(post.excerpt.rendered)},
          ${authorId},
          ${featuredMedia?.source_url || null},
          ${featuredMedia?.alt_text || null},
          ${post.status === "publish" ? "published" : post.status},
          ${new Date(post.date)},
          ${new Date(post.modified)},
          ${post.status === "publish" ? new Date(post.date) : null},
          ${wordCount},
          ${readingTime}
        )
        ON CONFLICT (wp_id) DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          excerpt = EXCLUDED.excerpt,
          author_id = EXCLUDED.author_id,
          featured_image_url = EXCLUDED.featured_image_url,
          featured_image_alt = EXCLUDED.featured_image_alt,
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at,
          word_count = EXCLUDED.word_count,
          reading_time_minutes = EXCLUDED.reading_time_minutes
        RETURNING id
      `;

      const postId = result[0].id;

      // Link categories
      for (const wpCatId of post.categories) {
        const categoryId = categoryMap.get(wpCatId);
        if (categoryId) {
          await sql`
            INSERT INTO post_categories (post_id, category_id)
            VALUES (${postId}, ${categoryId})
            ON CONFLICT DO NOTHING
          `;
        }
      }

      console.log(`  ✓ ${stripHtml(post.title.rendered).slice(0, 50)}...`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate post ${post.slug}:`, error);
    }
  }
}

// Main migration
async function migrate() {
  console.log("🚀 Starting WordPress to Neon migration...\n");
  console.log(`WordPress API: ${WP_API_URL}`);
  console.log(`Database: ${DATABASE_URL?.slice(0, 30)}...`);

  try {
    const categoryMap = await migrateCategories();
    const authorMap = await migrateAuthors();
    await migratePosts(authorMap, categoryMap);

    console.log("\n✅ Migration complete!");

    // Print summary
    const [postCount] = await sql`SELECT COUNT(*) as count FROM posts`;
    const [catCount] = await sql`SELECT COUNT(*) as count FROM categories`;
    const [authorCount] = await sql`SELECT COUNT(*) as count FROM authors`;

    console.log(`\n📊 Summary:`);
    console.log(`   Posts: ${postCount.count}`);
    console.log(`   Categories: ${catCount.count}`);
    console.log(`   Authors: ${authorCount.count}`);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
