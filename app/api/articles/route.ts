import { NextRequest, NextResponse } from "next/server";
import {
  getPublishedArticles,
  createArticle,
  upsertArticle,
  getArticleStats,
  generateSlug,
} from "@/lib/articles";
import { insertArticleSchema } from "@/shared/schema";

// GET /api/articles - List published articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const destination = searchParams.get("destination") || undefined;
    const articleType = searchParams.get("type") || undefined;
    const niche = searchParams.get("niche") || undefined;

    const { articles, total } = await getPublishedArticles({
      limit,
      offset,
      destination,
      articleType,
      niche,
    });

    return NextResponse.json({
      articles,
      total,
      limit,
      offset,
      hasMore: offset + articles.length < total,
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create or update an article
export async function POST(request: NextRequest) {
  try {
    // Simple API key auth for the generator
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.ARTICLES_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Generate slug if not provided
    if (!body.slug && body.title) {
      body.slug = generateSlug(body.title);
    }

    // Validate the input
    const validated = insertArticleSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid article data", details: validated.error.errors },
        { status: 400 }
      );
    }

    // Upsert (create or update by product code)
    const article = await upsertArticle(validated.data);

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        status: article.status,
        destination: article.destination,
      },
    });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
