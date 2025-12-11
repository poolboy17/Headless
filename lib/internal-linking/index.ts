/**
 * Internal Linking System
 * Autonomous module for AI-powered internal link management
 */

export { LINKING_CONFIG, type LinkCandidate, type InsertedLink } from './config';
export { 
  generateEmbedding, 
  generateEmbeddingsBatch, 
  createEmbeddingText, 
  stripHtml, 
  contentHash,
  cosineSimilarity,
  findSimilarPosts 
} from './embeddings';
export { findAnchorOpportunities, insertLinks, previewLinks } from './linker';
export { 
  processAllPosts, 
  processNewPost, 
  getLinkingStats,
  debugInfo,
  testEmbed,
  type ProcessingResult 
} from './processor';
