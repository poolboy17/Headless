/**
 * Content Sanitizer
 * Cleans WordPress post content of plugin artifacts, bad HTML, and security issues
 */

// Patterns to remove completely
const REMOVE_PATTERNS: RegExp[] = [
  // Link Whisper artifacts
  /\s*data-lwptoc[^=]*="[^"]*"/gi,
  /\s*data-lw[^=]*="[^"]*"/gi,
  /<div[^>]*class="[^"]*lwptoc[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
  /<span[^>]*class="[^"]*lw-[^"]*"[^>]*>([\s\S]*?)<\/span>/gi, // Keep inner content

  // Empty elements
  /<p>\s*<\/p>/gi,
  /<p>&nbsp;<\/p>/gi,
  /<div>\s*<\/div>/gi,
  /<span>\s*<\/span>/gi,

  // Multiple consecutive &nbsp;
  /(&nbsp;){3,}/gi,

  // Plugin comments
  /<!--\s*(?:wp:|plugin:|generated|powered|lwptoc)[^>]*-->/gi,

  // Inline scripts (security)
  /<script[^>]*>[\s\S]*?<\/script>/gi,

  // Inline styles (in content, not attributes)
  /<style[^>]*>[\s\S]*?<\/style>/gi,

  // Event handlers (security - XSS prevention)
  /\s*on(?:click|error|load|mouseover|mouseout|focus|blur)="[^"]*"/gi,

  // Empty style attributes
  /\s*style=["']\s*["']/gi,

  // Empty class attributes
  /\s*class=["']\s*["']/gi,
];

// Patterns to replace with something else
const REPLACE_PATTERNS: { pattern: RegExp; replacement: string }[] = [
  // Remove Link Whisper link wrapper classes but keep the link
  {
    pattern: /class="([^"]*)\s*lw-internal-link\s*([^"]*)"/gi,
    replacement: 'class="$1 $2"'
  },

  // Clean up double spaces in classes
  { pattern: /class="([^"]*)\s{2,}([^"]*)"/gi, replacement: 'class="$1 $2"' },

  // Fix javascript:void links to be proper anchors
  { pattern: /href=["']javascript:void\(0\)["']/gi, replacement: 'href="#"' },

  // Replace empty hrefs with # for accessibility
  { pattern: /href=["']['"](?=\s|>)/gi, replacement: 'href="#"' },

  // Clean orphan data attributes from plugins
  { pattern: /\s*data-element[^=]*="[^"]*"/gi, replacement: '' },
  { pattern: /\s*data-id="[^"]*"/gi, replacement: '' },
  { pattern: /\s*data-widget[^=]*="[^"]*"/gi, replacement: '' },
];

// Classes to strip from elements (but keep the elements)
const STRIP_CLASSES = [
  'lwptoc',
  'lwptoc-light',
  'lwptoc-notInToc',
  'lwptoc-header',
  'lwptoc-toggle',
  'lwptoc-content',
  'lwptoc-item',
  'lwptoc-link',
  'lw-internal-link',
  'elementor-widget',
  'elementor-element',
];

/**
 * Sanitizes HTML content by removing plugin artifacts and bad patterns
 */
export function sanitizeContent(html: string): string {
  if (!html) return '';

  let cleaned = html;

  // Apply removal patterns
  for (const pattern of REMOVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Apply replacement patterns
  for (const { pattern, replacement } of REPLACE_PATTERNS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Strip specific classes from class attributes
  const classPattern = /class="([^"]*)"/gi;
  cleaned = cleaned.replace(classPattern, (match, classes) => {
    let cleanedClasses = classes;
    for (const cls of STRIP_CLASSES) {
      cleanedClasses = cleanedClasses.replace(new RegExp(`\\b${cls}\\b`, 'gi'), '');
    }
    // Clean up extra spaces
    cleanedClasses = cleanedClasses.replace(/\s+/g, ' ').trim();
    return cleanedClasses ? `class="${cleanedClasses}"` : '';
  });

  // Final cleanup: remove any remaining empty attributes
  cleaned = cleaned.replace(/\s+(?=\s)/g, ' ');
  cleaned = cleaned.replace(/\s+>/g, '>');
  cleaned = cleaned.replace(/>\s+</g, '><');

  return cleaned.trim();
}

/**
 * Extracts plain text from HTML, removing all tags
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitizes content and wraps it for safe React rendering
 */
export function createSanitizedHtml(html: string): { __html: string } {
  return { __html: sanitizeContent(html) };
}
