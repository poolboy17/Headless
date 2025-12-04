import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WP_API_URL = 'https://cursedtours.com/wp-json/wp/v2';

interface AuditIssue {
  postId: number;
  postTitle: string;
  postSlug: string;
  issueType: string;
  description: string;
  match: string;
  count: number;
}

interface AuditResult {
  totalPosts: number;
  postsWithIssues: number;
  issues: AuditIssue[];
  patterns: Record<string, number>;
}

// Patterns to check for bad HTML/CSS artifacts
const ISSUE_PATTERNS = [
  // Link Whisper specific patterns
  { name: 'link-whisper-data', pattern: /data-lwptoc[^"]*="[^"]*"/gi, desc: 'Link Whisper table of contents data attribute' },
  { name: 'lwptoc-class', pattern: /class="[^"]*lwptoc[^"]*"/gi, desc: 'Link Whisper TOC class' },
  { name: 'lwptoc-div', pattern: /<div[^>]*lwptoc[^>]*>/gi, desc: 'Link Whisper TOC container' },
  { name: 'link-whisper-span', pattern: /<span[^>]*data-lw[^>]*>/gi, desc: 'Link Whisper span with data attributes' },
  { name: 'lw-internal-link', pattern: /class="[^"]*lw-internal-link[^"]*"/gi, desc: 'Link Whisper internal link class' },

  // Empty/broken link patterns
  { name: 'empty-href', pattern: /<a[^>]*href=["']["'][^>]*>/gi, desc: 'Empty href attribute' },
  { name: 'broken-anchor', pattern: /<a[^>]*href=["']#["'][^>]*>/gi, desc: 'Anchor link to # only' },
  { name: 'javascript-void', pattern: /href=["']javascript:void\(0\)["']/gi, desc: 'JavaScript void link' },

  // Inline styles that might be artifacts
  { name: 'orphan-inline-style', pattern: /style=["'][^"']*(?:display:\s*none|visibility:\s*hidden)[^"']*["']/gi, desc: 'Hidden inline styles' },
  { name: 'empty-style', pattern: /style=["']\s*["']/gi, desc: 'Empty style attribute' },

  // Bad HTML patterns
  { name: 'unclosed-span', pattern: /<span[^>]*>(?![^<]*<\/span>)/gi, desc: 'Potentially unclosed span tag' },
  { name: 'empty-paragraph', pattern: /<p>\s*<\/p>/gi, desc: 'Empty paragraph' },
  { name: 'empty-div', pattern: /<div>\s*<\/div>/gi, desc: 'Empty div' },
  { name: 'nbsp-only', pattern: /<p>&nbsp;<\/p>/gi, desc: 'Paragraph with only nbsp' },
  { name: 'multiple-nbsp', pattern: /(&nbsp;){3,}/gi, desc: 'Multiple consecutive nbsp' },

  // WordPress plugin artifacts
  { name: 'shortcode-remnant', pattern: /\[[a-z_]+[^\]]*\]/gi, desc: 'Unprocessed shortcode' },
  { name: 'plugin-comment', pattern: /<!--\s*(?:wp:|plugin:|generated|powered)[^>]*-->/gi, desc: 'Plugin comment marker' },

  // Data attributes from plugins
  { name: 'data-id-orphan', pattern: /data-id=["'][^"']*["']/gi, desc: 'Orphan data-id attribute' },
  { name: 'data-element', pattern: /data-element[^=]*=["'][^"']*["']/gi, desc: 'Data-element attribute (possibly from page builder)' },

  // CSS class artifacts
  { name: 'elementor-class', pattern: /class="[^"]*elementor-[^"]*"/gi, desc: 'Elementor class (if not using Elementor)' },
  { name: 'wp-block-legacy', pattern: /class="[^"]*wp-block-[^"]*legacy[^"]*"/gi, desc: 'Legacy WP block class' },

  // Broken images
  { name: 'broken-img-src', pattern: /<img[^>]*src=["'](?:about:blank|data:,|undefined|null)["'][^>]*>/gi, desc: 'Broken image source' },
  { name: 'empty-alt', pattern: /<img[^>]*alt=["']["'][^>]*>/gi, desc: 'Empty alt attribute (accessibility)' },

  // Script/style injection (security concern)
  { name: 'inline-script', pattern: /<script[^>]*>[^<]*<\/script>/gi, desc: 'Inline script tag in content' },
  { name: 'inline-style-tag', pattern: /<style[^>]*>[^<]*<\/style>/gi, desc: 'Inline style tag in content' },
  { name: 'onerror-handler', pattern: /onerror=["'][^"']*["']/gi, desc: 'OnError event handler (potential XSS)' },
  { name: 'onclick-handler', pattern: /onclick=["'][^"']*["']/gi, desc: 'OnClick event handler' },
];

async function fetchAllPosts(): Promise<{ id: number; title: { rendered: string }; slug: string; content: { rendered: string } }[]> {
  const allPosts: { id: number; title: { rendered: string }; slug: string; content: { rendered: string } }[] = [];
  let page = 1;
  const perPage = 50;

  while (true) {
    const response = await fetch(
      `${WP_API_URL}/posts?per_page=${perPage}&page=${page}&_fields=id,title,slug,content`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      console.error(`Failed to fetch posts page ${page}: ${response.status}`);
      break;
    }

    const posts = await response.json();
    if (posts.length === 0) break;

    allPosts.push(...posts);

    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
    if (page >= totalPages) break;
    page++;
  }

  return allPosts;
}

function auditContent(
  postId: number,
  postTitle: string,
  postSlug: string,
  content: string
): AuditIssue[] {
  const issues: AuditIssue[] = [];

  for (const { name, pattern, desc } of ISSUE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches && matches.length > 0) {
      issues.push({
        postId,
        postTitle,
        postSlug,
        issueType: name,
        description: desc,
        match: matches[0].slice(0, 100) + (matches[0].length > 100 ? '...' : ''),
        count: matches.length,
      });
    }
  }

  return issues;
}

export async function GET() {
  try {
    const posts = await fetchAllPosts();
    const result: AuditResult = {
      totalPosts: posts.length,
      postsWithIssues: 0,
      issues: [],
      patterns: {},
    };

    for (const post of posts) {
      const postIssues = auditContent(
        post.id,
        post.title.rendered,
        post.slug,
        post.content.rendered
      );

      if (postIssues.length > 0) {
        result.postsWithIssues++;
        result.issues.push(...postIssues);

        for (const issue of postIssues) {
          result.patterns[issue.issueType] = (result.patterns[issue.issueType] || 0) + issue.count;
        }
      }
    }

    // Sort issues by count (most frequent first)
    result.issues.sort((a, b) => b.count - a.count);

    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Audit failed:', error);
    return NextResponse.json(
      { error: 'Audit failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
