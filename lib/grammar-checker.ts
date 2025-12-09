/**
 * Spell and Grammar Checker Module
 *
 * Supports multiple AI providers for checking and fixing spelling/grammar errors.
 * Can process HTML content while preserving markup.
 */

import { createHash } from "crypto";

// ============================================================
// TYPES
// ============================================================

export interface CorrectionItem {
  original: string;
  corrected: string;
  type: "spelling" | "grammar" | "punctuation" | "style";
  explanation?: string;
}

export interface CheckResult {
  originalText: string;
  correctedText: string;
  hadCorrections: boolean;
  corrections: CorrectionItem[];
  provider: string;
  processingTimeMs: number;
}

export interface CheckerConfig {
  provider: "openai" | "anthropic" | "ollama";
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
}

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

function getConfig(): CheckerConfig {
  // Check for Anthropic first (Claude)
  if (process.env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.GRAMMAR_MODEL || "claude-3-haiku-20240307",
      enabled: process.env.GRAMMAR_CHECK_ENABLED !== "false",
    };
  }

  // Check for OpenAI
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
    return {
      provider: "openai",
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
      baseUrl: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      model: process.env.GRAMMAR_MODEL || "gpt-4o-mini",
      enabled: process.env.GRAMMAR_CHECK_ENABLED !== "false",
    };
  }

  // Fall back to Ollama (local)
  return {
    provider: "ollama",
    baseUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    model: process.env.GRAMMAR_MODEL || "llama3.2",
    enabled: process.env.GRAMMAR_CHECK_ENABLED !== "false",
  };
}

// ============================================================
// CACHE
// ============================================================

const cache = new Map<string, CheckResult>();
const MAX_CACHE_SIZE = 200;

function getCacheKey(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function getCached(text: string): CheckResult | undefined {
  return cache.get(getCacheKey(text));
}

function setCache(text: string, result: CheckResult): void {
  const key = getCacheKey(text);
  cache.set(key, result);

  // Evict oldest entries if cache is too large
  if (cache.size > MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

// ============================================================
// HTML PROCESSING
// ============================================================

interface TextSegment {
  start: number;
  end: number;
  content: string;
  isText: boolean;
}

function extractTextSegments(html: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const tagPattern = /<[^>]+>/g;
  let lastIndex = 0;
  let match;

  while ((match = tagPattern.exec(html)) !== null) {
    // Text before the tag
    if (match.index > lastIndex) {
      const content = html.slice(lastIndex, match.index);
      segments.push({
        start: lastIndex,
        end: match.index,
        content,
        isText: content.trim().length > 0,
      });
    }
    // The tag itself
    segments.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
      isText: false,
    });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last tag
  if (lastIndex < html.length) {
    const content = html.slice(lastIndex);
    segments.push({
      start: lastIndex,
      end: html.length,
      content,
      isText: content.trim().length > 0,
    });
  }

  return segments;
}

function reconstructHtml(segments: TextSegment[], correctedTexts: Map<number, string>): string {
  return segments
    .map((seg, index) => {
      if (seg.isText && correctedTexts.has(index)) {
        return correctedTexts.get(index);
      }
      return seg.content;
    })
    .join("");
}

// ============================================================
// AI PROVIDER IMPLEMENTATIONS
// ============================================================

const SYSTEM_PROMPT = `You are a professional proofreader and editor. Your task is to fix spelling, grammar, and punctuation errors in the provided text.

Rules:
1. Only fix actual errors - do not rewrite or change the writing style
2. Preserve the original tone and voice
3. Keep proper nouns, brand names, and intentional stylistic choices intact
4. Fix common issues: subject-verb agreement, tense consistency, comma usage, apostrophes
5. Do not add or remove content, only correct errors

Respond with a JSON object in this exact format:
{
  "corrected": "The corrected text here",
  "corrections": [
    {"original": "orignal word", "corrected": "original word", "type": "spelling"},
    {"original": "they was", "corrected": "they were", "type": "grammar"}
  ]
}

If there are no errors, return the original text unchanged with an empty corrections array.`;

async function checkWithOpenAI(text: string, config: CheckerConfig): Promise<CheckResult> {
  const startTime = Date.now();

  const response = await fetch(`${config.baseUrl || "https://api.openai.com/v1"}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content);

  return {
    originalText: text,
    correctedText: parsed.corrected || text,
    hadCorrections: (parsed.corrections?.length || 0) > 0,
    corrections: parsed.corrections || [],
    provider: "openai",
    processingTimeMs: Date.now() - startTime,
  };
}

async function checkWithAnthropic(text: string, config: CheckerConfig): Promise<CheckResult> {
  const startTime = Date.now();

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model || "claude-3-haiku-20240307",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `${SYSTEM_PROMPT}\n\nText to check:\n${text}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error("No response from Anthropic");
  }

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      originalText: text,
      correctedText: text,
      hadCorrections: false,
      corrections: [],
      provider: "anthropic",
      processingTimeMs: Date.now() - startTime,
    };
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    originalText: text,
    correctedText: parsed.corrected || text,
    hadCorrections: (parsed.corrections?.length || 0) > 0,
    corrections: parsed.corrections || [],
    provider: "anthropic",
    processingTimeMs: Date.now() - startTime,
  };
}

async function checkWithOllama(text: string, config: CheckerConfig): Promise<CheckResult> {
  const startTime = Date.now();

  const response = await fetch(`${config.baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model || "llama3.2",
      prompt: `${SYSTEM_PROMPT}\n\nText to check:\n${text}\n\nRespond with JSON only:`,
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.response;

  if (!content) {
    throw new Error("No response from Ollama");
  }

  const parsed = JSON.parse(content);

  return {
    originalText: text,
    correctedText: parsed.corrected || text,
    hadCorrections: (parsed.corrections?.length || 0) > 0,
    corrections: parsed.corrections || [],
    provider: "ollama",
    processingTimeMs: Date.now() - startTime,
  };
}

// ============================================================
// MAIN API
// ============================================================

/**
 * Check and fix spelling/grammar in plain text
 */
export async function checkText(text: string, customConfig?: Partial<CheckerConfig>): Promise<CheckResult> {
  const config = { ...getConfig(), ...customConfig };

  if (!config.enabled || !text?.trim()) {
    return {
      originalText: text,
      correctedText: text,
      hadCorrections: false,
      corrections: [],
      provider: "none",
      processingTimeMs: 0,
    };
  }

  // Check cache
  const cached = getCached(text);
  if (cached) {
    return { ...cached, processingTimeMs: 0 };
  }

  try {
    let result: CheckResult;

    switch (config.provider) {
      case "anthropic":
        result = await checkWithAnthropic(text, config);
        break;
      case "ollama":
        result = await checkWithOllama(text, config);
        break;
      case "openai":
      default:
        result = await checkWithOpenAI(text, config);
        break;
    }

    setCache(text, result);
    return result;
  } catch (error) {
    console.error("Grammar check error:", error);
    return {
      originalText: text,
      correctedText: text,
      hadCorrections: false,
      corrections: [],
      provider: config.provider,
      processingTimeMs: 0,
    };
  }
}

/**
 * Check and fix spelling/grammar in HTML content while preserving markup
 */
export async function checkHtml(html: string, customConfig?: Partial<CheckerConfig>): Promise<CheckResult> {
  const config = { ...getConfig(), ...customConfig };

  if (!config.enabled || !html?.trim()) {
    return {
      originalText: html,
      correctedText: html,
      hadCorrections: false,
      corrections: [],
      provider: "none",
      processingTimeMs: 0,
    };
  }

  const startTime = Date.now();
  const segments = extractTextSegments(html);
  const textSegments = segments.filter((s) => s.isText);

  if (textSegments.length === 0) {
    return {
      originalText: html,
      correctedText: html,
      hadCorrections: false,
      corrections: [],
      provider: config.provider,
      processingTimeMs: 0,
    };
  }

  // Combine text segments for a single API call
  const combinedText = textSegments.map((s) => s.content).join("\n<<<SEGMENT>>>\n");

  try {
    const result = await checkText(combinedText, config);

    if (!result.hadCorrections) {
      return {
        originalText: html,
        correctedText: html,
        hadCorrections: false,
        corrections: [],
        provider: result.provider,
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Split corrected text back into segments
    const correctedParts = result.correctedText.split("\n<<<SEGMENT>>>\n");
    const correctedTexts = new Map<number, string>();

    let textIndex = 0;
    segments.forEach((seg, index) => {
      if (seg.isText && textIndex < correctedParts.length) {
        correctedTexts.set(index, correctedParts[textIndex]);
        textIndex++;
      }
    });

    const correctedHtml = reconstructHtml(segments, correctedTexts);

    return {
      originalText: html,
      correctedText: correctedHtml,
      hadCorrections: correctedHtml !== html,
      corrections: result.corrections,
      provider: result.provider,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error("HTML grammar check error:", error);
    return {
      originalText: html,
      correctedText: html,
      hadCorrections: false,
      corrections: [],
      provider: config.provider,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Process multiple texts in batch
 */
export async function checkBatch(
  texts: string[],
  customConfig?: Partial<CheckerConfig>
): Promise<CheckResult[]> {
  const results = await Promise.all(
    texts.map((text) => checkText(text, customConfig))
  );
  return results;
}

/**
 * Get a summary of corrections for reporting
 */
export function summarizeCorrections(results: CheckResult[]): {
  totalChecked: number;
  totalCorrected: number;
  correctionsByType: Record<string, number>;
  totalProcessingTimeMs: number;
} {
  const correctionsByType: Record<string, number> = {};
  let totalCorrected = 0;
  let totalProcessingTimeMs = 0;

  for (const result of results) {
    if (result.hadCorrections) {
      totalCorrected++;
    }
    totalProcessingTimeMs += result.processingTimeMs;

    for (const correction of result.corrections) {
      correctionsByType[correction.type] = (correctionsByType[correction.type] || 0) + 1;
    }
  }

  return {
    totalChecked: results.length,
    totalCorrected,
    correctionsByType,
    totalProcessingTimeMs,
  };
}

// ============================================================
// EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================

/**
 * Drop-in replacement for the old checkAndFixSpelling function
 */
export async function checkAndFixSpelling(html: string): Promise<{ correctedText: string; hadCorrections: boolean }> {
  const result = await checkHtml(html);
  return {
    correctedText: result.correctedText,
    hadCorrections: result.hadCorrections,
  };
}
