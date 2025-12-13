/**
 * Text Cleanup Utility for CursedTours
 * Frontend fallback for spelling/grammar corrections
 * Runs on render - doesn't modify source content
 */

// Common spelling mistakes in paranormal/ghost tour content
const SPELLING_FIXES: Record<string, string> = {
  // Common typos
  'teh': 'the',
  'adn': 'and',
  'taht': 'that',
  'wiht': 'with',
  'thier': 'their',
  'recieve': 'receive',
  'beleive': 'believe',
  'occured': 'occurred',
  'occurence': 'occurrence',
  'definately': 'definitely',
  'seperate': 'separate',
  'accomodate': 'accommodate',
  'untill': 'until',
  'begining': 'beginning',
  'apparant': 'apparent',
  'cemetary': 'cemetery',
  'cemetry': 'cemetery',
  'cemetary': 'cemetery',
  'haunt': 'haunt',
  'gost': 'ghost',
  'ghosts': 'ghosts',
  'paranomral': 'paranormal',
  'supernatura': 'supernatural',
  'expereince': 'experience',
  'experiece': 'experience',
  'histroy': 'history',
  'hisotry': 'history',
  'mysetrious': 'mysterious',
  'misterous': 'mysterious',
  'spirtual': 'spiritual',
  'spirtiual': 'spiritual',
  'investiagtion': 'investigation',
  'investigaton': 'investigation',
  'phenonmenon': 'phenomenon',
  'phenomenom': 'phenomenon',
  'occurances': 'occurrences',
  'activty': 'activity',
  'activitiy': 'activity',
  'apparition': 'apparition',
  'apperition': 'apparition',
  'poltergeits': 'poltergeist',
  'poltergiest': 'poltergeist',
};

// Regex patterns for grammar fixes
const GRAMMAR_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Double spaces
  { pattern: /  +/g, replacement: ' ' },
  // Space before punctuation
  { pattern: / +([.,!?;:])/g, replacement: '$1' },
  // Missing space after punctuation (but not in URLs or numbers)
  { pattern: /([.,!?;:])([A-Za-z])/g, replacement: '$1 $2' },
  // Multiple punctuation
  { pattern: /([.!?]){2,}/g, replacement: '$1' },
  // Capitalize after period
  { pattern: /\. ([a-z])/g, replacement: (match, letter) => `. ${letter.toUpperCase()}` },
  // Fix "a" vs "an" before vowels
  { pattern: /\ba ([aeiou])/gi, replacement: 'an $1' },
  // Fix "an" before consonants (excluding silent h words)
  { pattern: /\ban ([bcdfgjklmnpqrstvwxyz])/gi, replacement: 'a $1' },
  // Repeated words
  { pattern: /\b(\w+)\s+\1\b/gi, replacement: '$1' },
  // Smart quotes cleanup (normalize to straight quotes)
  { pattern: /[""]/g, replacement: '"' },
  { pattern: /['']/g, replacement: "'" },
  // En/em dash cleanup
  { pattern: /–/g, replacement: '-' },
  { pattern: /—/g, replacement: ' - ' },
  // Ellipsis normalization
  { pattern: /\.{2,}/g, replacement: '...' },
  // Remove extra line breaks
  { pattern: /\n{3,}/g, replacement: '\n\n' },
];

// Words to exclude from "an" correction (silent h, etc.)
const AN_EXCEPTIONS = ['hour', 'honor', 'honest', 'heir', 'herb'];

/**
 * Clean up text content - spelling and grammar fixes
 */
export function cleanupText(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Apply spelling fixes (case-insensitive, word boundaries)
  for (const [wrong, correct] of Object.entries(SPELLING_FIXES)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    cleaned = cleaned.replace(regex, (match) => {
      // Preserve original case
      if (match === match.toUpperCase()) return correct.toUpperCase();
      if (match[0] === match[0].toUpperCase()) {
        return correct.charAt(0).toUpperCase() + correct.slice(1);
      }
      return correct;
    });
  }
  
  // Apply grammar patterns
  for (const { pattern, replacement } of GRAMMAR_PATTERNS) {
    if (typeof replacement === 'string') {
      cleaned = cleaned.replace(pattern, replacement);
    } else {
      cleaned = cleaned.replace(pattern, replacement as any);
    }
  }
  
  return cleaned.trim();
}

/**
 * Clean up HTML content while preserving tags
 */
export function cleanupHTML(html: string): string {
  if (!html) return html;
  
  // Split by HTML tags, clean text portions, rejoin
  const parts = html.split(/(<[^>]+>)/);
  
  return parts.map((part, index) => {
    // Skip HTML tags
    if (part.startsWith('<')) return part;
    // Clean text content
    return cleanupText(part);
  }).join('');
}

/**
 * Audit text and return list of issues found
 */
export function auditText(text: string): Array<{ original: string; suggestion: string; type: 'spelling' | 'grammar' }> {
  const issues: Array<{ original: string; suggestion: string; type: 'spelling' | 'grammar' }> = [];
  
  // Check spelling
  for (const [wrong, correct] of Object.entries(SPELLING_FIXES)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          original: match,
          suggestion: correct,
          type: 'spelling'
        });
      });
    }
  }
  
  // Check grammar patterns
  if (/  +/.test(text)) {
    issues.push({ original: 'double spaces', suggestion: 'single space', type: 'grammar' });
  }
  if (/ +[.,!?;:]/.test(text)) {
    issues.push({ original: 'space before punctuation', suggestion: 'remove space', type: 'grammar' });
  }
  if (/\b(\w+)\s+\1\b/i.test(text)) {
    issues.push({ original: 'repeated word', suggestion: 'remove duplicate', type: 'grammar' });
  }
  
  return issues;
}

export default { cleanupText, cleanupHTML, auditText };
