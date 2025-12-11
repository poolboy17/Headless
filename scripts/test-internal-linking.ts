// Test script for internal linking system
// Run with: npx tsx scripts/test-internal-linking.ts

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as path from 'path';

// Load .env.local
config({ path: path.join(process.cwd(), '.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function runMigration() {
  console.log('🔄 Running migration...');
  
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
  console.log('✅ Created post_embeddings table');
  
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
  console.log('✅ Created internal_links table');
  
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
  console.log('✅ Created linking_log table');
  
  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS post_embeddings_post_idx ON post_embeddings(post_id)`;
  await sql`CREATE INDEX IF NOT EXISTS internal_links_source_idx ON internal_links(source_post_id)`;
  await sql`CREATE INDEX IF NOT EXISTS internal_links_target_idx ON internal_links(target_post_id)`;
  console.log('✅ Created indexes');
  
  console.log('✅ Migration complete!');
}

async function checkTables() {
  console.log('\n📊 Checking tables...');
  
  const [posts] = await sql`SELECT COUNT(*) as count FROM posts WHERE status = 'published'`;
  console.log(`Posts: ${posts.count}`);
  
  const [embeddings] = await sql`SELECT COUNT(*) as count FROM post_embeddings`;
  console.log(`Embeddings: ${embeddings.count}`);
  
  const [links] = await sql`SELECT COUNT(*) as count FROM internal_links`;
  console.log(`Internal Links: ${links.count}`);
  
  const [logs] = await sql`SELECT COUNT(*) as count FROM linking_log`;
  console.log(`Log entries: ${logs.count}`);
}

async function main() {
  try {
    await runMigration();
    await checkTables();
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
