import { db } from '../lib/db';
import { posts } from '../shared/schema';
import { like, eq, or } from 'drizzle-orm';

function deepClean(content: string): string {
  let cleaned = content;
  
  // Remove AI segment markers
  cleaned = cleaned.replace(/<<<SEGMENT>>>/g, '');
  cleaned = cleaned.replace(/<<>>/g, '');
  
  let iterations = 0;
  while (iterations < 30) {
    const before = cleaned;
    
    // NUCLEAR OPTIONS for deeply corrupted patterns:
    
    // 1. Encoded anchor containing another encoded anchor
    cleaned = cleaned.replace(/&lt;a[^>]*&lt;a[^>]*&gt;/gi, '');
    
    // 2. Encoded anchor containing a real anchor tag
    cleaned = cleaned.replace(/&lt;a[^>]*<a[^>]+>[^<]*<\/a>[^>]*&gt;?/gi, '');
    
    // 3. Encoded anchor ending with </a (broken close tag)
    cleaned = cleaned.replace(/&lt;a[^>]*<\/a\b/gi, '');
    
    // 4. Encoded anchor that doesn't close properly (no &gt;)
    cleaned = cleaned.replace(/&lt;a href="[^"]*"(?![^<]*&gt;)/gi, '');
    
    // 5. Any &lt;a with nested < inside href
    cleaned = cleaned.replace(/&lt;a href="[^"]*<[^"]*"/gi, '');
    
    // Standard cleanups (for properly encoded anchors)
    cleaned = cleaned.replace(/&lt;a class="wpil_keyword_link"[^>]*&gt;/gi, '');
    cleaned = cleaned.replace(/&lt;a href="([^"<>]+)"&gt;/g, '<a href="$1">');
    cleaned = cleaned.replace(/&lt;\/a&gt;/g, '</a>');
    
    // Headings
    cleaned = cleaned.replace(/&lt;(h[1-6])&gt;/g, '<$1>');
    cleaned = cleaned.replace(/&lt;\/(h[1-6])&gt;/g, '</$1>');
    
    // Other tags
    cleaned = cleaned.replace(/&lt;(strong|em|b|i|p)&gt;/g, '<$1>');
    cleaned = cleaned.replace(/&lt;\/(strong|em|b|i|p)&gt;/g, '</$1>');
    
    // Fix quotes
    cleaned = cleaned.replace(/&#8220;/g, '"');
    cleaned = cleaned.replace(/&#8221;/g, '"');
    cleaned = cleaned.replace(/&#8217;/g, "'");
    cleaned = cleaned.replace(/&#8216;/g, "'");
    cleaned = cleaned.replace(/&quot;/g, '"');
    
    // Remove wpil attributes from real anchors
    cleaned = cleaned.replace(/<a class="wpil_keyword_link" /gi, '<a ');
    cleaned = cleaned.replace(/\s*data-wpil[^"]*="[^"]*"/gi, '');
    
    if (before === cleaned) break;
    iterations++;
  }
  
  return cleaned;
}

async function auditAndFix() {
  console.log('=== Full Database Content Audit & Cleanup ===\n');
  
  const affected = await db.select({ id: posts.id, slug: posts.slug, content: posts.content })
    .from(posts)
    .where(or(
      like(posts.content, '%<<<SEGMENT>>>%'),
      like(posts.content, '%&lt;a %'),
      like(posts.content, '%wpil_%'),
      like(posts.content, '%data-wpil%')
    ));
  
  console.log(`Found ${affected.length} potentially affected posts\n`);
  
  let fixed = 0;
  for (const post of affected) {
    const cleaned = deepClean(post.content);
    if (cleaned !== post.content) {
      const diff = post.content.length - cleaned.length;
      await db.update(posts).set({ content: cleaned }).where(eq(posts.id, post.id));
      fixed++;
      console.log(`✓ ${post.slug} (${diff > 0 ? '-' : '+'}${Math.abs(diff)} chars)`);
    }
  }
  
  console.log(`\nFixed ${fixed} posts`);
  
  // Verification
  const remaining = await db.select({ slug: posts.slug })
    .from(posts)
    .where(or(
      like(posts.content, '%<<<SEGMENT>>>%'),
      like(posts.content, '%&lt;a %'),
      like(posts.content, '%wpil_%'),
      like(posts.content, '%data-wpil%')
    ));
  
  console.log('\n=== Verification ===');
  if (remaining.length === 0) {
    console.log('✓ All posts clean!');
  } else {
    console.log(`⚠ ${remaining.length} posts still have issues`);
    remaining.slice(0, 5).forEach(r => console.log(`  - ${r.slug}`));
  }
  
  process.exit(0);
}

auditAndFix().catch(e => { console.error(e); process.exit(1); });
