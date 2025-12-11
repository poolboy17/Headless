#!/usr/bin/env npx tsx
/**
 * Check what articles exist in the Neon database
 * Run with: npx tsx scripts/check-articles.ts
 */

import { db, articles } from "../lib/db";
import { sql, eq, count } from "drizzle-orm";

async function checkArticles() {
  console.log("🔍 Checking articles in Neon database...\n");

  // Get total counts by status
  const statusCounts = await db
    .select({
      status: articles.status,
      count: count(),
    })
    .from(articles)
    .groupBy(articles.status);

  console.log("📊 Article counts by status:");
  statusCounts.forEach((s) => {
    console.log(`   ${s.status}: ${s.count}`);
  });

  // Get total
  const totalResult = await db.select({ count: count() }).from(articles);
  console.log(`\n📈 Total articles: ${totalResult[0]?.count || 0}`);

  // Get articles by destination
  const byDestination = await db
    .select({
      destination: articles.destination,
      count: count(),
    })
    .from(articles)
    .groupBy(articles.destination)
    .orderBy(sql`count(*) DESC`)
    .limit(20);

  console.log("\n🌍 Top destinations:");
  byDestination.forEach((d) => {
    console.log(`   ${d.destination || "Unknown"}: ${d.count}`);
  });

  // Get sample of recent articles
  const recentArticles = await db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      status: articles.status,
      destination: articles.destination,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .orderBy(sql`${articles.createdAt} DESC`)
    .limit(20);

  console.log("\n📝 Recent 20 articles:");
  recentArticles.forEach((a) => {
    const statusIcon = a.status === "published" ? "✅" : "📝";
    console.log(
      `   ${statusIcon} [${a.status}] ${a.slug}`
    );
    console.log(`      Title: ${a.title?.slice(0, 60)}...`);
    console.log(`      Destination: ${a.destination || "None"}`);
    console.log(`      Created: ${a.createdAt}`);
    console.log("");
  });

  // Check if any are published
  const publishedCount = await db
    .select({ count: count() })
    .from(articles)
    .where(eq(articles.status, "published"));

  console.log(`\n✅ Published articles: ${publishedCount[0]?.count || 0}`);

  // List all slugs that are published (for sitemap purposes)
  const publishedSlugs = await db
    .select({ slug: articles.slug })
    .from(articles)
    .where(eq(articles.status, "published"));

  if (publishedSlugs.length > 0) {
    console.log("\n🔗 Published article slugs (accessible at /tour/[slug]):");
    publishedSlugs.forEach((s) => {
      console.log(`   https://cursedtours.com/tour/${s.slug}`);
    });
  }

  process.exit(0);
}

checkArticles().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
