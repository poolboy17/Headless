/**
 * Admin API for Internal Linking System
 * GET - Get statistics
 * POST - Trigger manual processing
 */

import { NextResponse } from 'next/server';
import { processAllPosts, processNewPost, getLinkingStats } from '@/lib/internal-linking';

// Simple admin protection (use proper auth in production)
const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.CRON_SECRET;

function isAuthorized(request: Request): boolean {
  if (!ADMIN_SECRET) return true; // Allow if no secret set
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${ADMIN_SECRET}`;
}

/**
 * GET /api/admin/internal-links
 * Returns linking statistics
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const stats = await getLinkingStats();
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/internal-links
 * Trigger manual processing
 * Body: { action: 'process_all' | 'process_post', postId?: string }
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { action, postId } = body;
    
    if (action === 'process_post' && postId) {
      const result = await processNewPost(postId);
      return NextResponse.json({ success: result.success, result });
    }
    
    if (action === 'process_all') {
      const result = await processAllPosts();
      const stats = await getLinkingStats();
      return NextResponse.json({ success: true, result, stats });
    }
    
    if (action === 'debug') {
      // Debug: check what findPostsNeedingEmbeddings returns
      const { debugInfo } = await import('@/lib/internal-linking/processor');
      const info = await debugInfo();
      return NextResponse.json({ success: true, debug: info });
    }
    
    return NextResponse.json({ 
      error: 'Invalid action. Use process_all or process_post with postId' 
    }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const maxDuration = 300;
