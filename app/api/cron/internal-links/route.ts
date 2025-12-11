/**
 * Cron API Route for Internal Linking
 * Vercel Cron calls this endpoint to process internal links
 * 
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/internal-links",
 *     "schedule": "0 3 * * *"
 *   }]
 * }
 */

import { NextResponse } from 'next/server';
import { processAllPosts, getLinkingStats } from '@/lib/internal-linking';

// Vercel cron secret for security
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  console.log('[Internal Links Cron] Starting processing...');
  const startTime = Date.now();
  
  try {
    // Run the processor
    const result = await processAllPosts();
    
    // Get updated stats
    const stats = await getLinkingStats();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`[Internal Links Cron] Completed in ${duration}s`);
    console.log(`  - Processed: ${result.processed}`);
    console.log(`  - Embedded: ${result.embedded}`);
    console.log(`  - Links added: ${result.linked}`);
    
    return NextResponse.json({
      success: true,
      duration: `${duration}s`,
      result,
      stats: {
        totalPosts: stats.totalPosts,
        totalEmbeddings: stats.totalEmbeddings,
        totalLinks: stats.totalLinks,
        avgLinksPerPost: stats.avgLinksPerPost,
        orphanCount: stats.orphanCount,
      },
    });
    
  } catch (error) {
    console.error('[Internal Links Cron] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Allow manual trigger via POST
export async function POST(request: Request) {
  return GET(request);
}

// Vercel cron needs max duration
export const maxDuration = 300; // 5 minutes
