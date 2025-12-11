// Migration script for internal linking system
// Run with: node scripts/migrate-linking.mjs

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load DATABASE_URL from .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)/);
if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = neon(dbUrlMatch[1]);

async function runMigration() {
  console.log('🔄 Running internal linking migration...\n');
  
  try {
    // Create post_embeddings table
    await sql`
      CREATE TABLE IF NOT EXISTS post_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID UNIQUE NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        embedding TEXT NOT NULL,
        content_hash VARCHAR(32),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ post_embeddings table ready');
    
    // Create internal_links table
    await sql`
      CREATE TABLE IF NOT EXISTS internal_links (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        target_post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        anchor_text TEXT NOT NULL,
        position INTEGER,
        similarity DECIMAL(4,3),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ internal_links table ready');
    
    // Create linking_log table
    await sql`
      CREATE TABLE IF NOT EXISTS linking_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        message TEXT,
        links_added INTEGER DEFAULT 0,
        processed_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✅ linking_log table ready');
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS post_embeddings_post_idx ON post_embeddings(post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS internal_links_source_idx ON internal_links(source_post_id)`;
    await sql`CREATE INDEX IF NOT EXISTS internal_links_target_idx ON internal_links(target_post_id)`;
    console.log('✅ Indexes created');
    
    console.log('\n✅ Migration complete!\n');
    
    // Show stats
    const [postsCount] = await sql`SELECT COUNT(*) as count FROM posts WHERE status = 'published'`;
    const [embCount] = await sql`SELECT COUNT(*) as count FROM post_embeddings`;
    const [linksCount] = await sql`SELECT COUNT(*) as count FROM internal_links`;
    
    console.log('📊 Current status:');
    console.log(`   Posts: ${postsCount.count}`);
    console.log(`   Embeddings: ${embCount.count}`);
    console.log(`   Internal Links: ${linksCount.count}`);
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

runMigration();
