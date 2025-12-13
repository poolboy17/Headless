// lib/enhance-content.ts
// Utility function to enhance post content with internal links

const WORKER_URL = 'https://internal-linker-sidecar.genaromvasquez.workers.dev';

interface LinkSuggestion {
  keyword: string;
  url: string;
  title: string;
  postId: number;
  relevance: number;
}

interface EnhanceStats {
  linksInjected?: number;
  keywordsFound?: number;
  suggestions?: number;
  error?: boolean;
  message?: string;
}

interface EnhanceResult {
  content: string;
  stats: EnhanceStats;
}

/**
 * Enhance post content with internal links by calling the Cloudflare Worker
 * 
 * @param content - The HTML content to enhance
 * @param postId - The post ID (to avoid self-linking)
 * @param maxLinks - Maximum number of links to inject (default: 5)
 * @returns Enhanced content and stats
 */
export async function enhanceContentWithLinks(
  content: string,
  postId: number | string,
  maxLinks: number = 5
): Promise<EnhanceResult> {
  try {
    // Call Worker API to get link suggestions
    const response = await fetch(`${WORKER_URL}/api/internal-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, postId, maxLinks })
    });

    if (!response.ok) {
      console.error(`Worker API error: ${response.status}`);
      return { content, stats: { error: true } };
    }

    const data = await response.json();

    if (!data.success) {
      console.error('Worker returned error:', data.error);
      return { content, stats: { error: true } };
    }

    // Inject links into content
    let enhancedContent = content;
    const linksInjected: Array<{ keyword: string; url: string }> = [];

    for (const suggestion of data.suggestions as LinkSuggestion[]) {
      // Escape special regex characters
      const escapedKeyword = suggestion.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Find first occurrence (case-insensitive)
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
      const match = enhancedContent.match(regex);
      
      // Only inject if keyword found and URL not already linked
      if (match && !enhancedContent.includes(`href="${suggestion.url}"`)) {
        enhancedContent = enhancedContent.replace(
          regex,
          `<a href="${suggestion.url}" class="internal-link" title="${escapeHtml(suggestion.title)}">${match[0]}</a>`
        );
        
        linksInjected.push({
          keyword: suggestion.keyword,
          url: suggestion.url
        });
      }
    }

    return {
      content: enhancedContent,
      stats: {
        linksInjected: linksInjected.length,
        keywordsFound: data.stats?.keywordsFound || 0,
        suggestions: data.suggestions.length
      }
    };

  } catch (error) {
    console.error('Error enhancing content:', error);
    // Return original content if enhancement fails
    return { 
      content, 
      stats: { 
        error: true, 
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    };
  }
}

/**
 * Escape HTML special characters
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

/**
 * Rebuild the keyword index (call this after publishing new posts)
 */
export async function rebuildLinkIndex(): Promise<any> {
  try {
    const response = await fetch(
      `${WORKER_URL}/api/rebuild-index?key=cursed2024`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`Rebuild failed: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error rebuilding index:', error);
    throw error;
  }
}
