import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WP_API_URL = 'https://wp.cursedtours.com/wp-json/wp/v2';
const SITE_DOMAIN = 'cursedtours.com';

interface InternalLink {
  postId: number;
  postTitle: string;
  postSlug: string;
  linkText: string;
  linkHref: string;
  hasLwClass: boolean;
}

interface LinksAuditResult {
  totalPosts: number;
  postsWithInternalLinks: number;
  totalInternalLinks: number;
  linksWithLwClass: number;
  links: InternalLink[];
}

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

function extractInternalLinks(
  postId: number,
  postTitle: string,
  postSlug: string,
  content: string
): InternalLink[] {
  const links: InternalLink[] = [];

  // Match all anchor tags
  const anchorRegex = /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>([^<]*)<\/a>/gi;
  let match;

  while ((match = anchorRegex.exec(content)) !== null) {
    const fullTag = match[1];
    const href = match[2];
    const linkText = match[3].replace(/&[^;]+;/g, ' ').trim();

    // Check if it's an internal link
    const isInternal =
      href.includes(SITE_DOMAIN) ||
      (href.startsWith('/') && !href.startsWith('//'));

    if (isInternal && linkText) {
      // Check if it has Link Whisper class
      const hasLwClass = /lw-internal-link|lwptoc/i.test(fullTag);

      links.push({
        postId,
        postTitle,
        postSlug,
        linkText,
        linkHref: href,
        hasLwClass,
      });
    }
  }

  return links;
}

export async function GET() {
  try {
    const posts = await fetchAllPosts();
    const result: LinksAuditResult = {
      totalPosts: posts.length,
      postsWithInternalLinks: 0,
      totalInternalLinks: 0,
      linksWithLwClass: 0,
      links: [],
    };

    const postsWithLinks = new Set<number>();

    for (const post of posts) {
      const links = extractInternalLinks(
        post.id,
        post.title.rendered,
        post.slug,
        post.content.rendered
      );

      if (links.length > 0) {
        postsWithLinks.add(post.id);
        result.links.push(...links);

        for (const link of links) {
          if (link.hasLwClass) {
            result.linksWithLwClass++;
          }
        }
      }
    }

    result.postsWithInternalLinks = postsWithLinks.size;
    result.totalInternalLinks = result.links.length;

    // Sort by post, then by link text
    result.links.sort((a, b) => {
      if (a.postId !== b.postId) return a.postId - b.postId;
      return a.linkText.localeCompare(b.linkText);
    });

    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Links audit failed:', error);
    return NextResponse.json(
      { error: 'Links audit failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
