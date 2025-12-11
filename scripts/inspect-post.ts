import { db } from '../lib/db';
import { posts } from '../shared/schema';
import { like, or } from 'drizzle-orm';

async function inspect() {
  const affected = await db.select({ slug: posts.slug, content: posts.content })
    .from(posts)
    .where(or(
      like(posts.content, '%&lt;a %'),
      like(posts.content, '%wpil_%'),
      like(posts.content, '%data-wpil%')
    ))
    .limit(3);
  
  for (const post of affected) {
    console.log(`\n=== ${post.slug} ===`);
    
    // Find remaining patterns
    const ltA = post.content.match(/&lt;a [^>]{0,100}/g) || [];
    if (ltA.length > 0) {
      console.log('Encoded anchors:');
      [...new Set(ltA)].slice(0, 3).forEach(m => console.log(`  ${m}`));
    }
    
    const wpil = post.content.match(/.{0,30}wpil.{0,30}/g) || [];
    if (wpil.length > 0) {
      console.log('WPIL patterns:');
      [...new Set(wpil)].slice(0, 3).forEach(m => console.log(`  ${m}`));
    }
    
    const dataWpil = post.content.match(/.{0,20}data-wpil.{0,50}/g) || [];
    if (dataWpil.length > 0) {
      console.log('Data-wpil attributes:');
      [...new Set(dataWpil)].slice(0, 3).forEach(m => console.log(`  ${m}`));
    }
  }
  
  process.exit(0);
}

inspect().catch(e => { console.error(e); process.exit(1); });
