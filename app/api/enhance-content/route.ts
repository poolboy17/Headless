// app/api/enhance-content/route.ts
// API route that calls the Cloudflare Worker and injects internal links

import { NextRequest, NextResponse } from 'next/server';

const WORKER_URL = 'https://internal-linker-sidecar.genaromvasquez.workers.dev';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, postId, maxLinks = 5 } = body;

    // Validate input
    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Call Cloudflare Worker to get link suggestions
    const workerResponse = await fetch(`${WORKER_URL}/api/internal-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, postId, maxLinks })
    });

    if (!workerResponse.ok) {
      throw new Error(`Worker API error: ${workerResponse.status}`);
    }

    const data = await workerResponse.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get link suggestions');
    }

    // Inject links into content
    let enhancedContent = content;
    const linksInjected: Array<{keyword: string; url: string; title: string}> = [];

    for (const suggestion of data.suggestions) {
      // Escape special regex characters in keyword
      const escapedKeyword = suggestion.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Create regex to find first occurrence of keyword (case-insensitive, word boundary)
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      
      // Check if keyword exists and isn't already linked
      const match = enhancedContent.match(regex);
      if (match && !enhancedContent.includes(`href="${suggestion.url}"`)) {
        // Replace first occurrence with link
        enhancedContent = enhancedContent.replace(
          regex,
          `<a href="${suggestion.url}" class="internal-link" title="${escapeHtml(suggestion.title)}">${match[0]}</a>`
        );
        
        linksInjected.push({
          keyword: suggestion.keyword,
          url: suggestion.url,
          title: suggestion.title
        });
      }
    }

    // Return enhanced content with stats
    return NextResponse.json({
      success: true,
      enhancedContent,
      originalLength: content.length,
      enhancedLength: enhancedContent.length,
      linksInjected,
      stats: {
        suggestionsReceived: data.suggestions.length,
        linksActuallyInjected: linksInjected.length,
        keywordsFound: data.stats?.keywordsFound || 0
      }
    });

  } catch (error) {
    console.error('Error enhancing content:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
