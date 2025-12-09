-- Add contentSections JSONB column to articles table
-- This allows storing structured content that Next.js can render consistently

ALTER TABLE articles
ADD COLUMN IF NOT EXISTS content_sections JSONB;

-- Add inclusions/exclusions for tour details
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS inclusions TEXT[],
ADD COLUMN IF NOT EXISTS exclusions TEXT[],
ADD COLUMN IF NOT EXISTS meeting_point TEXT,
ADD COLUMN IF NOT EXISTS accessibility TEXT;

COMMENT ON COLUMN articles.content_sections IS 'Structured JSON content sections for consistent rendering';
