import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, articles, articleFaqs } from "@/lib/db";
import { eq } from "drizzle-orm";
import type { TourPageData } from "@/types/tour-content";

// Simple API key auth - set TOUR_API_KEY in Vercel env vars
const API_KEY = process.env.TOUR_API_KEY;

function validateAuth(request: NextRequest): boolean {
  if (!API_KEY) return true; // No key set = open (dev mode)
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${API_KEY}`;
}

// POST /api/tour-pages - Create or update a tour page
export async function POST(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data: TourPageData = await request.json();

    // Validate required fields
    if (!data.productCode || !data.slug || !data.title) {
      return NextResponse.json(
        { error: "Missing required fields: productCode, slug, title" },
        { status: 400 }
      );
    }

    // Check if article exists
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.productCode, data.productCode))
      .limit(1);

    const articleData = {
      productCode: data.productCode,
      slug: data.slug,
      title: data.title,
      content: "", // Empty - we use contentSections instead
      contentSections: data.sections as unknown as Record<string, unknown>,
      excerpt: data.excerpt || null,
      metaDescription: data.metaDescription || null,
      focusKeyphrase: data.focusKeyphrase || null,
      destination: data.destination || null,
      bookingUrl: data.bookingUrl || null,
      price: data.price?.toString() || null,
      currency: data.currency || "USD",
      rating: data.rating?.toString() || null,
      reviewCount: data.reviewCount || null,
      durationMinutes: data.durationMinutes || null,
      featuredImageUrl: data.featuredImage?.url || null,
      featuredImageAlt: data.featuredImage?.alt || null,
      inclusions: data.details?.inclusions || null,
      exclusions: data.details?.exclusions || null,
      meetingPoint: data.details?.meetingPoint || null,
      accessibility: data.details?.accessibility || null,
      status: "published" as const,
      articleType: "tour" as const,
      niche: "haunted" as const,
      publishedAt: new Date(),
      updatedAt: new Date(),
    };

    let articleId: string;

    if (existing.length > 0) {
      // Update existing
      await db
        .update(articles)
        .set(articleData)
        .where(eq(articles.productCode, data.productCode));
      articleId = existing[0].id;
    } else {
      // Create new
      const result = await db
        .insert(articles)
        .values(articleData)
        .returning({ id: articles.id });
      articleId = result[0].id;
    }

    // Handle FAQs if provided
    if (data.faqs && data.faqs.length > 0) {
      // Delete existing FAQs
      await db.delete(articleFaqs).where(eq(articleFaqs.articleId, articleId));

      // Insert new FAQs
      const faqData = data.faqs.map((faq, index) => ({
        articleId,
        question: faq.question,
        answer: faq.answer,
        sortOrder: index,
      }));

      await db.insert(articleFaqs).values(faqData);
    }

    // Revalidate the page cache so changes appear immediately
    revalidatePath(`/tour/${data.slug}`);
    revalidatePath("/tours"); // Tour listing page
    if (data.destination) {
      revalidatePath(`/tours/${data.destination.toLowerCase().replace(/\s+/g, "-")}`);
    }

    return NextResponse.json({
      success: true,
      id: articleId,
      slug: data.slug,
      url: `/tour/${data.slug}`,
      revalidated: true,
      message: existing.length > 0 ? "Tour page updated" : "Tour page created",
    });
  } catch (error) {
    console.error("Error saving tour page:", error);
    return NextResponse.json(
      { error: "Failed to save tour page", details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/tour-pages - List all tour page slugs (for Replit to check what exists)
export async function GET(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get("productCode");

    if (productCode) {
      // Get specific tour page
      const result = await db
        .select({
          id: articles.id,
          productCode: articles.productCode,
          slug: articles.slug,
          title: articles.title,
          updatedAt: articles.updatedAt,
        })
        .from(articles)
        .where(eq(articles.productCode, productCode))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({ exists: false });
      }

      return NextResponse.json({ exists: true, ...result[0] });
    }

    // List all tour page slugs
    const result = await db
      .select({
        productCode: articles.productCode,
        slug: articles.slug,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(eq(articles.articleType, "tour"));

    return NextResponse.json({
      count: result.length,
      pages: result,
    });
  } catch (error) {
    console.error("Error fetching tour pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch tour pages" },
      { status: 500 }
    );
  }
}

// DELETE /api/tour-pages?productCode=XXX - Delete a tour page
export async function DELETE(request: NextRequest) {
  if (!validateAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productCode = searchParams.get("productCode");

    if (!productCode) {
      return NextResponse.json(
        { error: "productCode is required" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(articles)
      .where(eq(articles.productCode, productCode))
      .returning({ id: articles.id, slug: articles.slug });

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Tour page not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: result[0],
    });
  } catch (error) {
    console.error("Error deleting tour page:", error);
    return NextResponse.json(
      { error: "Failed to delete tour page" },
      { status: 500 }
    );
  }
}
