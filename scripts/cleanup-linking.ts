import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function cleanupAll() {
  console.log('=== FULL CLEANUP: Internal Linking System ===\n');
  
  // 1. Drop the internal linking tables
  console.log('1. Dropping internal linking tables...');
  await sql`DROP TABLE IF EXISTS linking_log CASCADE`;
  await sql`DROP TABLE IF EXISTS internal_links CASCADE`;
  await sql`DROP TABLE IF EXISTS post_embeddings CASCADE`;
  console.log('   ✓ Tables dropped\n');
  
  // 2. Clean ALL posts of corruption
  console.log('2. Cleaning post content...');
  
  const result = await sql`
    UPDATE posts 
    SET content = regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(
                  content,
                  '<<<SEGMENT>>>', '', 'g'
                ),
                '<<>>', '', 'g'
              ),
              '&lt;a[^>]*&gt;', '', 'g'
            ),
            '&lt;/a&gt;', '', 'g'
          ),
          'data-wpil-[^"]*="[^"]*"', '', 'g'
        ),
        ' class="wpil_keyword_link"', '', 'g'
      ),
      '  +', ' ', 'g'
    )
    WHERE content LIKE '%<<<SEGMENT>>>%'
       OR content LIKE '%<<>>%'
       OR content LIKE '%&lt;a %'
       OR content LIKE '%wpil_%'
       OR content LIKE '%data-wpil%'
    RETURNING slug
  `;
  
  console.log(`   ✓ Cleaned ${result.length} posts\n`);
  
  // 3. Verify
  console.log('3. Verifying...');
  const remaining = await sql`
    SELECT slug FROM posts 
    WHERE content LIKE '%<<<SEGMENT>>>%'
       OR content LIKE '%&lt;a %'
       OR content LIKE '%wpil_%'
       OR content LIKE '%data-wpil%'
  `;
  
  if (remaining.length === 0) {
    console.log('   ✓ All posts clean!\n');
  } else {
    console.log(`   ⚠ ${remaining.length} posts still need attention`);
  }
  
  console.log('=== CLEANUP COMPLETE ===');
  process.exit(0);
}

cleanupAll().catch(e => { console.error(e); process.exit(1); });
