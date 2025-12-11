/**
 * Internal Linking System Configuration
 * Autonomous module for AI-powered internal link management
 */

export const LINKING_CONFIG = {
  // Similarity thresholds
  MIN_SIMILARITY: 0.72,           // Minimum cosine similarity to consider posts related
  HIGH_SIMILARITY: 0.85,          // High confidence match
  
  // Link limits
  MAX_LINKS_PER_POST: 8,          // Maximum outbound links per post
  MIN_LINKS_PER_POST: 3,          // Target minimum links
  MIN_WORDS_BETWEEN_LINKS: 150,   // Prevent link stuffing
  MAX_ANCHOR_DENSITY: 0.02,       // Max 2% of content as anchor text
  
  // Anchor text
  MIN_ANCHOR_WORDS: 2,
  MAX_ANCHOR_WORDS: 6,
  
  // Processing
  BATCH_SIZE: 20,                 // Posts per batch
  EMBEDDING_MODEL: 'text-embedding-3-small',
  EMBEDDING_DIMENSIONS: 1536,
  
  // Site URL for links
  SITE_URL: 'https://cursedtours.com',
  
  // Priority keywords for paranormal niche
  PRIORITY_KEYWORDS: [
    'ghost hunting', 'paranormal investigation', 'haunted', 'spirits',
    'EVP', 'ghost tour', 'abandoned asylum', 'haunted house', 'cemetery',
    'supernatural', 'poltergeist', 'apparition', 'ghost story', 
    'urban exploration', 'séance', 'medium', 'psychic', 'haunting'
  ],
  
  // Stop words for anchor text
  STOP_ANCHORS: new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'this', 'that', 'click', 'here', 'read',
    'more', 'learn', 'see', 'view', 'check', 'visit', 'our', 'your'
  ])
};

export type LinkCandidate = {
  postId: string;
  slug: string;
  title: string;
  similarity: number;
  anchor?: string;
  position?: number;
};

export type InsertedLink = {
  sourcePostId: string;
  targetPostId: string;
  anchorText: string;
  position: number;
  similarity: number;
};
