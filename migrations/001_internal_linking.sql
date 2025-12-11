-- Internal Linking System Tables
-- Run this in Neon console to add the tables

-- Post embeddings for similarity search
CREATE TABLE IF NOT EXISTS post_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL UNIQUE REFERENCES posts(id) ON DELETE CASCADE,
  embedding TEXT NOT NULL, -- JSON stringified float32 array
  content_hash VARCHAR(32), -- MD5 hash to detect changes
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS post_embeddings_post_idx ON post_embeddings(post_id);

-- Internal links tracking
CREATE TABLE IF NOT EXISTS internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  target_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  position INTEGER, -- Character position in content
  similarity DECIMAL(4, 3), -- Cosine similarity score
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS internal_links_source_idx ON internal_links(source_post_id);
CREATE INDEX IF NOT EXISTS internal_links_target_idx ON internal_links(target_post_id);

-- Processing log for debugging
CREATE TABLE IF NOT EXISTS linking_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'embed', 'link', 'update', 'error'
  status VARCHAR(20) NOT NULL, -- 'success', 'error', 'skipped'
  message TEXT,
  links_added INTEGER DEFAULT 0,
  processed_at TIMESTAMP DEFAULT NOW() NOT NULL
);
