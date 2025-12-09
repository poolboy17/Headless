import { NextResponse } from "next/server";
import { getArticleStats } from "@/lib/articles";

// GET /api/articles/stats - Get article statistics
export async function GET() {
  try {
    const stats = await getArticleStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching article stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
