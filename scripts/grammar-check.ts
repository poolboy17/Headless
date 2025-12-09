#!/usr/bin/env npx tsx
/**
 * Grammar and Spell Check CLI Tool
 *
 * Processes posts from the database and fixes spelling/grammar errors.
 *
 * Usage:
 *   npx tsx scripts/grammar-check.ts [options]
 *
 * Options:
 *   --dry-run      Show corrections without saving (default: true)
 *   --save         Save corrections to database
 *   --limit N      Process only N posts (default: all)
 *   --slug SLUG    Process a single post by slug
 *   --provider P   Use specific provider: openai, anthropic, ollama
 *   --verbose      Show detailed output
 *
 * Environment variables:
 *   DATABASE_URL              - Neon database connection string (required)
 *   ANTHROPIC_API_KEY         - Anthropic API key (for Claude)
 *   OPENAI_API_KEY            - OpenAI API key
 *   OLLAMA_URL                - Ollama server URL (default: http://localhost:11434)
 *   GRAMMAR_MODEL             - Model to use (default: depends on provider)
 *
 * Examples:
 *   # Dry run on all posts with Anthropic
 *   DATABASE_URL="..." ANTHROPIC_API_KEY="..." npx tsx scripts/grammar-check.ts
 *
 *   # Fix a specific post and save
 *   DATABASE_URL="..." npx tsx scripts/grammar-check.ts --slug my-post --save
 *
 *   # Process 5 posts with verbose output
 *   DATABASE_URL="..." npx tsx scripts/grammar-check.ts --limit 5 --verbose
 */

import { neon } from "@neondatabase/serverless";
import {
  checkHtml,
  summarizeCorrections,
  type CheckResult,
  type CheckerConfig,
} from "../lib/grammar-checker";

// ============================================================
// CLI ARGUMENTS
// ============================================================

interface CliArgs {
  dryRun: boolean;
  save: boolean;
  limit?: number;
  slug?: string;
  provider?: "openai" | "anthropic" | "ollama";
  verbose: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: CliArgs = {
    dryRun: true,
    save: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--dry-run":
        parsed.dryRun = true;
        parsed.save = false;
        break;
      case "--save":
        parsed.save = true;
        parsed.dryRun = false;
        break;
      case "--verbose":
      case "-v":
        parsed.verbose = true;
        break;
      case "--limit":
        parsed.limit = parseInt(args[++i], 10);
        break;
      case "--slug":
        parsed.slug = args[++i];
        break;
      case "--provider":
        parsed.provider = args[++i] as "openai" | "anthropic" | "ollama";
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
    }
  }

  return parsed;
}

function printHelp(): void {
  console.log(`
Grammar and Spell Check CLI Tool

Usage:
  npx tsx scripts/grammar-check.ts [options]

Options:
  --dry-run      Show corrections without saving (default)
  --save         Save corrections to database
  --limit N      Process only N posts
  --slug SLUG    Process a single post by slug
  --provider P   Use provider: openai, anthropic, ollama
  --verbose, -v  Show detailed output
  --help, -h     Show this help

Environment:
  DATABASE_URL        Neon database connection string (required)
  ANTHROPIC_API_KEY   Anthropic API key
  OPENAI_API_KEY      OpenAI API key
  OLLAMA_URL          Ollama server URL
  GRAMMAR_MODEL       Model to use
`);
}

// ============================================================
// DATABASE
// ============================================================

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

interface Post {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
}

async function getPosts(args: CliArgs): Promise<Post[]> {
  let query = "SELECT id, slug, title, content, excerpt FROM posts WHERE status = 'published'";
  const params: unknown[] = [];

  if (args.slug) {
    query += " AND slug = $1";
    params.push(args.slug);
  }

  query += " ORDER BY created_at DESC";

  if (args.limit && !args.slug) {
    query += ` LIMIT ${args.limit}`;
  }

  const result = await sql(query, params);
  return result as Post[];
}

async function updatePost(id: string, content: string, excerpt: string | null): Promise<void> {
  await sql(
    "UPDATE posts SET content = $1, excerpt = $2, updated_at = NOW() WHERE id = $3",
    [content, excerpt, id]
  );
}

// ============================================================
// PROCESSING
// ============================================================

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

function colorize(text: string, color: string): string {
  const colors: Record<string, string> = {
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    bold: "\x1b[1m",
  };
  return `${colors[color] || ""}${text}${colors.reset}`;
}

async function processPost(
  post: Post,
  args: CliArgs,
  config?: Partial<CheckerConfig>
): Promise<{ post: Post; contentResult: CheckResult; excerptResult: CheckResult | null }> {
  console.log(`\n${colorize("Processing:", "cyan")} ${post.title}`);
  console.log(`${colorize("Slug:", "dim")} ${post.slug}`);

  // Check content
  const contentResult = await checkHtml(post.content, config);

  // Check excerpt if present
  let excerptResult: CheckResult | null = null;
  if (post.excerpt) {
    excerptResult = await checkHtml(post.excerpt, config);
  }

  // Show results
  if (contentResult.hadCorrections || excerptResult?.hadCorrections) {
    console.log(`${colorize("Status:", "yellow")} Corrections found`);

    if (args.verbose) {
      if (contentResult.corrections.length > 0) {
        console.log(`\n${colorize("Content corrections:", "bold")}`);
        for (const c of contentResult.corrections) {
          console.log(
            `  ${colorize(c.original, "red")} → ${colorize(c.corrected, "green")} [${c.type}]`
          );
        }
      }

      if (excerptResult?.corrections.length) {
        console.log(`\n${colorize("Excerpt corrections:", "bold")}`);
        for (const c of excerptResult.corrections) {
          console.log(
            `  ${colorize(c.original, "red")} → ${colorize(c.corrected, "green")} [${c.type}]`
          );
        }
      }
    } else {
      const totalCorrections =
        contentResult.corrections.length + (excerptResult?.corrections.length || 0);
      console.log(`  ${totalCorrections} correction(s) found (use --verbose to see details)`);
    }

    if (args.save) {
      await updatePost(
        post.id,
        contentResult.correctedText,
        excerptResult?.correctedText || post.excerpt
      );
      console.log(`${colorize("Saved:", "green")} Changes written to database`);
    } else {
      console.log(`${colorize("Dry run:", "blue")} Changes not saved (use --save to persist)`);
    }
  } else {
    console.log(`${colorize("Status:", "green")} No corrections needed`);
  }

  console.log(
    `${colorize("Time:", "dim")} ${contentResult.processingTimeMs + (excerptResult?.processingTimeMs || 0)}ms`
  );

  return { post, contentResult, excerptResult };
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const args = parseArgs();

  console.log(colorize("\n=== Grammar & Spell Check Tool ===\n", "bold"));

  // Show configuration
  const providerInfo = args.provider || "auto-detect";
  console.log(`${colorize("Provider:", "cyan")} ${providerInfo}`);
  console.log(`${colorize("Mode:", "cyan")} ${args.save ? "Save changes" : "Dry run"}`);
  if (args.limit) console.log(`${colorize("Limit:", "cyan")} ${args.limit} posts`);
  if (args.slug) console.log(`${colorize("Slug:", "cyan")} ${args.slug}`);

  // Fetch posts
  console.log(`\n${colorize("Fetching posts...", "dim")}`);
  const posts = await getPosts(args);

  if (posts.length === 0) {
    console.log(colorize("\nNo posts found matching criteria.", "yellow"));
    return;
  }

  console.log(`Found ${posts.length} post(s) to process\n`);

  // Process posts in parallel batches
  const config: Partial<CheckerConfig> = args.provider ? { provider: args.provider } : {};
  const results: { post: Post; contentResult: CheckResult; excerptResult: CheckResult | null }[] = [];
  const BATCH_SIZE = 5; // Process 5 posts at a time

  for (let i = 0; i < posts.length; i += BATCH_SIZE) {
    const batch = posts.slice(i, i + BATCH_SIZE);
    console.log(`\n${colorize(`--- Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(posts.length / BATCH_SIZE)} ---`, "magenta")}`);

    const batchResults = await Promise.all(
      batch.map(async (post) => {
        try {
          return await processPost(post, args, config);
        } catch (error) {
          console.error(`${colorize("Error processing:", "red")} ${post.slug}`, error);
          return null;
        }
      })
    );

    results.push(...batchResults.filter((r): r is NonNullable<typeof r> => r !== null));
  }

  // Summary
  const allContentResults = results.map((r) => r.contentResult);
  const allExcerptResults = results.map((r) => r.excerptResult).filter(Boolean) as CheckResult[];
  const summary = summarizeCorrections([...allContentResults, ...allExcerptResults]);

  console.log(colorize("\n=== Summary ===\n", "bold"));
  console.log(`Posts processed: ${summary.totalChecked}`);
  console.log(`Posts with corrections: ${summary.totalCorrected}`);
  console.log(`Total processing time: ${(summary.totalProcessingTimeMs / 1000).toFixed(2)}s`);

  if (Object.keys(summary.correctionsByType).length > 0) {
    console.log(`\nCorrections by type:`);
    for (const [type, count] of Object.entries(summary.correctionsByType)) {
      console.log(`  ${type}: ${count}`);
    }
  }

  if (!args.save && summary.totalCorrected > 0) {
    console.log(colorize("\nNote: Run with --save to persist corrections to database", "yellow"));
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
