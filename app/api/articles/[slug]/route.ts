import { NextRequest, NextResponse } from "next/server";
import {
  getArticleBySlug,
  getArticleFaqs,
  getArticlesByDestination,
  publishArticle,
  updateArticle,
} from "@/lib/articles";

// GET /api/articles/[slug] - Get single article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Get FAQs for this article
    const faqs = await getArticleFaqs(article.id);

    // Get related articles (same destination)
    const related = article.destination
      ? await getArticlesByDestination(article.destination, 4)
      : [];

    // Filter out current article from related
    const relatedArticles = related
      .filter((a) => a.id !== article.id)
      .slice(0, 3);

    return NextResponse.json({
      article,
      faqs,
      relatedArticles,
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

// PATCH /api/articles/[slug] - Update article
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const expectedKey = process.env.ARTICLES_API_KEY;

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const article = await getArticleBySlug(slug);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const body = await request.json();

    // Handle publish action
    if (body.action === "publish") {
      const published = await publishArticle(article.id);
      return NextResponse.json({ success: true, article: published });
    }

    // Update article fields
    const updated = await updateArticle(article.id, body);
    return NextResponse.json({ success: true, article: updated });
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}
