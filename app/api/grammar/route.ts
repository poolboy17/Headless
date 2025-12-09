import { NextRequest, NextResponse } from "next/server";
import { checkText, checkHtml, type CheckResult } from "@/lib/grammar-checker";

/**
 * POST /api/grammar
 *
 * Check and fix spelling/grammar errors in text.
 *
 * Request body:
 * {
 *   "text": "Text to check",
 *   "html": true,           // Optional: treat as HTML (default: false)
 *   "provider": "openai"    // Optional: openai, anthropic, ollama
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "original": "orignal text",
 *   "corrected": "original text",
 *   "hadCorrections": true,
 *   "corrections": [
 *     { "original": "orignal", "corrected": "original", "type": "spelling" }
 *   ],
 *   "provider": "openai",
 *   "processingTimeMs": 234
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { text, html = false, provider } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'text' field" },
        { status: 400 }
      );
    }

    if (text.length > 50000) {
      return NextResponse.json(
        { success: false, error: "Text exceeds maximum length of 50,000 characters" },
        { status: 400 }
      );
    }

    const config = provider ? { provider } : undefined;

    let result: CheckResult;
    if (html) {
      result = await checkHtml(text, config);
    } else {
      result = await checkText(text, config);
    }

    return NextResponse.json({
      success: true,
      original: result.originalText,
      corrected: result.correctedText,
      hadCorrections: result.hadCorrections,
      corrections: result.corrections,
      provider: result.provider,
      processingTimeMs: result.processingTimeMs,
    });
  } catch (error) {
    console.error("Grammar check API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/grammar
 *
 * Health check and configuration info
 */
export async function GET(): Promise<NextResponse> {
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasOpenAI = !!(process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
  const hasOllama = true; // Always available locally

  let activeProvider = "none";
  if (hasAnthropic) activeProvider = "anthropic";
  else if (hasOpenAI) activeProvider = "openai";
  else if (hasOllama) activeProvider = "ollama";

  return NextResponse.json({
    status: "ok",
    enabled: process.env.GRAMMAR_CHECK_ENABLED !== "false",
    providers: {
      anthropic: hasAnthropic,
      openai: hasOpenAI,
      ollama: hasOllama,
    },
    activeProvider,
    model: process.env.GRAMMAR_MODEL || "default",
  });
}
