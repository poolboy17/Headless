import { NextRequest, NextResponse } from "next/server";
import { semanticSearch, checkPgvectorEnabled } from "@/lib/semantic-search";
import { searchPostsForPage } from "@/lib/posts";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "10", 10);
  const mode = searchParams.get("mode") || "hybrid"; // "semantic", "keyword", "hybrid"

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    // Check if semantic search is available
    const hasEmbeddings = await checkPgvectorEnabled();

    if (!hasEmbeddings || mode === "keyword") {
      // Fallback to keyword search
      const results = await searchPostsForPage({
        query: query.trim(),
        perPage: limit,
      });

      return NextResponse.json({
        results: results.posts.map((post) => ({
          id: post.id,
          slug: post.slug,
          title: post.title.rendered,
          excerpt: post.excerpt.rendered,
          featuredImage: post._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
          publishedAt: post.date,
          score: 1,
          matchType: "keyword",
        })),
        total: results.totalPosts,
        mode: "keyword",
      });
    }

    // Use semantic/hybrid search
    const results = await semanticSearch(query.trim(), {
      limit,
      threshold: 0.4,
      includeKeyword: mode === "hybrid",
    });

    return NextResponse.json({
      results: results.map((result) => ({
        id: result.id,
        slug: result.slug,
        title: result.title,
        excerpt: result.excerpt,
        featuredImage: result.featured_image_url,
        publishedAt: result.published_at,
        score: result.score,
        matchType: result.score > 0.6 ? "semantic" : "hybrid",
      })),
      total: results.length,
      mode: mode,
    });
  } catch (error) {
    console.error("Search error:", error);
    
    // Fallback to basic search on any error
    try {
      const results = await searchPostsForPage({
        query: query.trim(),
        perPage: limit,
      });

      return NextResponse.json({
        results: results.posts.map((post) => ({
          id: post.id,
          slug: post.slug,
          title: post.title.rendered,
          excerpt: post.excerpt.rendered,
          featuredImage: post._embedded?.["wp:featuredmedia"]?.[0]?.source_url,
          publishedAt: post.date,
          score: 1,
          matchType: "keyword",
        })),
        total: results.totalPosts,
        mode: "keyword",
        fallback: true,
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { error: "Search failed", details: String(error) },
        { status: 500 }
      );
    }
  }
}

export async function POST(request: NextRequest) {
  // POST endpoint for more complex search options
  try {
    const body = await request.json();
    const { query, limit = 10, mode = "hybrid", filters = {} } = body;

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const results = await semanticSearch(query.trim(), {
      limit,
      threshold: 0.4,
      includeKeyword: mode === "hybrid",
    });

    return NextResponse.json({
      results: results.map((result) => ({
        id: result.id,
        slug: result.slug,
        title: result.title,
        excerpt: result.excerpt,
        featuredImage: result.featured_image_url,
        publishedAt: result.published_at,
        score: result.score,
      })),
      total: results.length,
      mode,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed", details: String(error) },
      { status: 500 }
    );
  }
}
