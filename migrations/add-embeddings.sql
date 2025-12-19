-- Enable pgvector extension (run once in Neon console)
CREATE EXTENSION IF NOT EXISTS vector;

-- Post embeddings table for semantic search
CREATE TABLE IF NOT EXISTS post_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,  -- OpenAI text-embedding-3-small dimension
  content_hash VARCHAR(64) NOT NULL,  -- To detect when re-embedding is needed
  model VARCHAR(50) DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(post_id)
);

-- Index for fast similarity search
CREATE INDEX IF NOT EXISTS post_embeddings_vector_idx 
ON post_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for post lookups
CREATE INDEX IF NOT EXISTS post_embeddings_post_idx ON post_embeddings(post_id);

-- Function to search posts by semantic similarity
CREATE OR REPLACE FUNCTION search_posts_semantic(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  post_id UUID,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.post_id,
    1 - (pe.embedding <=> query_embedding) AS similarity
  FROM post_embeddings pe
  JOIN posts p ON pe.post_id = p.id
  WHERE p.status = 'published'
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
