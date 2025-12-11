/**
 * Link Inserter - BULLETPROOF VERSION
 * Finds anchor text opportunities and inserts internal links safely
 */

import { LINKING_CONFIG, type LinkCandidate, type InsertedLink } from './config';

/**
 * Find anchor text opportunities in content for target posts
 * Only matches text that is ENTIRELY within a single text node (not spanning tags)
 */
export function findAnchorOpportunities(
  content: string,
  targetPosts: Array<{ postId: string; slug: string; title: string; similarity: number }>
): LinkCandidate[] {
  const candidates: LinkCandidate[] = [];
  
  // Get existing link targets to avoid duplicates
  const existingLinks = findExistingInternalLinks(content);
  
  // Extract safe text segments (text between HTML tags, not inside links)
  const safeSegments = extractSafeTextSegments(content);
  
  for (const post of targetPosts) {
    // Skip if already linked to this post
    if (existingLinks.has(post.slug)) continue;
    
    // Try to find anchor in safe segments only
    const anchor = findAnchorInSegments(post.title, safeSegments, content);
    
    if (anchor) {
      candidates.push({
        ...post,
        anchor: anchor.text,
        position: anchor.position,
      });
    }
  }
  
  return candidates;
}


type TextSegment = {
  text: string;
  start: number;  // Position in original HTML
  end: number;
};

/**
 * Extract text segments that are safe for link insertion
 * Returns only text that is NOT inside: links, scripts, styles, or HTML tags
 */
function extractSafeTextSegments(html: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let i = 0;
  let inUnsafeZone = false;
  let unsafeDepth = 0;
  let segmentStart = 0;
  
  // Tags that make zones unsafe for link insertion
  const unsafeTags = ['a', 'script', 'style', 'code', 'pre', 'textarea', 'button'];
  
  while (i < html.length) {
    // Check for tag start
    if (html[i] === '<') {
      // Save any text before this tag
      if (!inUnsafeZone && i > segmentStart) {
        const text = html.slice(segmentStart, i);
        if (text.trim().length > 0) {
          segments.push({ text, start: segmentStart, end: i });
        }
      }
      
      // Find tag end
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) break;
      
      const tagContent = html.slice(i + 1, tagEnd);
      const isClosing = tagContent.startsWith('/');
      const tagName = (isClosing ? tagContent.slice(1) : tagContent)
        .split(/[\s\/]/)[0].toLowerCase();
      
      // Track unsafe zones
      if (unsafeTags.includes(tagName)) {
        if (isClosing) {
          unsafeDepth = Math.max(0, unsafeDepth - 1);
          if (unsafeDepth === 0) inUnsafeZone = false;
        } else if (!tagContent.endsWith('/')) { // Not self-closing
          unsafeDepth++;
          inUnsafeZone = true;
        }
      }
      
      i = tagEnd + 1;
      segmentStart = i;
    } else {
      i++;
    }
  }
  
  // Don't forget last segment
  if (!inUnsafeZone && i > segmentStart) {
    const text = html.slice(segmentStart, i);
    if (text.trim().length > 0) {
      segments.push({ text, start: segmentStart, end: i });
    }
  }
  
  return segments;
}


/**
 * Find anchor text within safe segments only
 */
function findAnchorInSegments(
  title: string,
  segments: TextSegment[],
  originalHtml: string
): { text: string; position: number } | null {
  const titleLower = title.toLowerCase();
  const titleWords = title.split(/\s+/).filter(w => w.length > 0);
  
  // Strategy 1: Full title match
  for (const seg of segments) {
    const segLower = seg.text.toLowerCase();
    const idx = segLower.indexOf(titleLower);
    if (idx !== -1) {
      return {
        text: seg.text.slice(idx, idx + title.length),
        position: seg.start + idx,
      };
    }
  }
  
  // Strategy 2: Partial phrases (4, 3, 2 words)
  for (const length of [4, 3, 2]) {
    if (length > titleWords.length) continue;
    
    for (let i = 0; i <= titleWords.length - length; i++) {
      const phrase = titleWords.slice(i, i + length).join(' ');
      const phraseLower = phrase.toLowerCase();
      
      if (isMostlyStopWords(phrase)) continue;
      
      for (const seg of segments) {
        const segLower = seg.text.toLowerCase();
        const idx = segLower.indexOf(phraseLower);
        if (idx !== -1) {
          return {
            text: seg.text.slice(idx, idx + phrase.length),
            position: seg.start + idx,
          };
        }
      }
    }
  }
  
  return null;
}


/**
 * Insert links into content - SAFE VERSION
 * Inserts from end to start to preserve positions
 */
export function insertLinks(
  content: string,
  candidates: LinkCandidate[],
  maxLinks: number = LINKING_CONFIG.MAX_LINKS_PER_POST
): { content: string; insertions: InsertedLink[] } {
  const insertions: InsertedLink[] = [];
  
  // Count existing internal links
  const existingCount = countInternalLinks(content);
  const availableSlots = maxLinks - existingCount;
  
  if (availableSlots <= 0 || candidates.length === 0) {
    return { content, insertions: [] };
  }
  
  // Sort by similarity (best first), take only what we need
  const sorted = [...candidates]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, availableSlots);
  
  // Sort by position DESCENDING (insert from end first to preserve positions)
  sorted.sort((a, b) => (b.position || 0) - (a.position || 0));
  
  let modifiedContent = content;
  
  for (const candidate of sorted) {
    if (!candidate.anchor || candidate.position === undefined) continue;
    
    const start = candidate.position;
    const end = start + candidate.anchor.length;
    
    // CRITICAL: Verify the text at this position matches exactly
    const actualText = modifiedContent.slice(start, end);
    if (actualText !== candidate.anchor) {
      console.warn(`[Linker] Skipping: text mismatch at ${start}. Expected "${candidate.anchor}", got "${actualText}"`);
      continue;
    }
    
    // CRITICAL: Double-check we're not inside a tag
    if (isInsideHtmlTag(modifiedContent, start)) {
      console.warn(`[Linker] Skipping: position ${start} is inside HTML tag`);
      continue;
    }
    
    // Create the link - use correct URL format (no /post/ prefix)
    const url = `${LINKING_CONFIG.SITE_URL}/${candidate.slug}/`;
    const safeTitle = escapeHtml(candidate.title);
    const linkHtml = `<a href="${url}" title="${safeTitle}">${actualText}</a>`;
    
    // Insert the link
    modifiedContent = 
      modifiedContent.slice(0, start) + 
      linkHtml + 
      modifiedContent.slice(end);
    
    insertions.push({
      sourcePostId: '', // Set by caller
      targetPostId: candidate.postId,
      anchorText: actualText,
      position: start,
      similarity: candidate.similarity,
    });
  }
  
  // FINAL VALIDATION: Check for malformed HTML
  if (!validateHtml(modifiedContent)) {
    console.error('[Linker] HTML validation failed after insertions, reverting');
    return { content, insertions: [] };
  }
  
  return { content: modifiedContent, insertions };
}


/**
 * Check if position is inside an HTML tag (between < and >)
 */
function isInsideHtmlTag(html: string, position: number): boolean {
  const before = html.slice(0, position);
  const lastOpen = before.lastIndexOf('<');
  const lastClose = before.lastIndexOf('>');
  return lastOpen > lastClose;
}

/**
 * Basic HTML validation - check for unclosed tags
 */
function validateHtml(html: string): boolean {
  // Check anchor tags are properly closed
  const openAnchors = (html.match(/<a\s/gi) || []).length;
  const closeAnchors = (html.match(/<\/a>/gi) || []).length;
  
  if (openAnchors !== closeAnchors) {
    console.error(`[Linker] Anchor tag mismatch: ${openAnchors} open, ${closeAnchors} close`);
    return false;
  }
  
  // Check for common malformed patterns
  const badPatterns = [
    /<a[^>]*<a/i,           // Nested anchor start
    /<\/a>[^<]*<\/a>/i,     // Double close
    /<a[^>]*>[^<]*<[^\/]/i, // Tag inside anchor (except closing)
  ];
  
  for (const pattern of badPatterns) {
    if (pattern.test(html)) {
      console.error(`[Linker] Bad pattern detected: ${pattern}`);
      return false;
    }
  }
  
  return true;
}


/**
 * Find slugs of existing internal links (handles both URL formats)
 */
function findExistingInternalLinks(content: string): Set<string> {
  const slugs = new Set<string>();
  
  // Match both /post/slug/ and /slug/ formats
  const patterns = [
    /href=["'](?:https?:\/\/)?(?:www\.)?cursedtours\.com\/post\/([^"'\/]+)/gi,
    /href=["'](?:https?:\/\/)?(?:www\.)?cursedtours\.com\/([^"'\/]+)\/["']/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const slug = match[1];
      // Skip common non-post paths
      if (!['category', 'tag', 'author', 'page', 'search'].includes(slug)) {
        slugs.add(slug);
      }
    }
  }
  
  return slugs;
}

/**
 * Count existing internal links
 */
function countInternalLinks(content: string): number {
  const pattern = /href=["'](?:https?:\/\/)?(?:www\.)?cursedtours\.com\/[^"']+["']/gi;
  return (content.match(pattern) || []).length;
}

/**
 * Check if phrase is mostly stop words
 */
function isMostlyStopWords(phrase: string): boolean {
  const words = phrase.toLowerCase().split(/\s+/);
  const stopCount = words.filter(w => LINKING_CONFIG.STOP_ANCHORS.has(w)).length;
  return stopCount >= words.length * 0.6;
}

/**
 * Escape HTML special characters for attributes
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


/**
 * Preview what links would be inserted (DRY RUN)
 * Returns detailed info without modifying content
 */
export function previewLinks(
  content: string,
  candidates: LinkCandidate[],
  maxLinks: number = LINKING_CONFIG.MAX_LINKS_PER_POST
): Array<{
  targetSlug: string;
  targetTitle: string;
  anchorText: string;
  similarity: number;
  contextBefore: string;
  contextAfter: string;
  wouldInsert: string;
}> {
  const previews: ReturnType<typeof previewLinks> = [];
  
  const existingCount = countInternalLinks(content);
  const availableSlots = maxLinks - existingCount;
  
  if (availableSlots <= 0) return previews;
  
  const sorted = [...candidates]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, availableSlots);
  
  for (const candidate of sorted) {
    if (!candidate.anchor || candidate.position === undefined) continue;
    
    const start = candidate.position;
    const end = start + candidate.anchor.length;
    
    // Get context (50 chars before and after)
    const contextStart = Math.max(0, start - 50);
    const contextEnd = Math.min(content.length, end + 50);
    
    const url = `${LINKING_CONFIG.SITE_URL}/${candidate.slug}/`;
    const linkHtml = `<a href="${url}" title="${escapeHtml(candidate.title)}">${candidate.anchor}</a>`;
    
    previews.push({
      targetSlug: candidate.slug,
      targetTitle: candidate.title,
      anchorText: candidate.anchor,
      similarity: Math.round(candidate.similarity * 1000) / 1000,
      contextBefore: content.slice(contextStart, start),
      contextAfter: content.slice(end, contextEnd),
      wouldInsert: linkHtml,
    });
  }
  
  return previews;
}
