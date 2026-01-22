// app/api/revalidate/route.ts
// On-demand ISR revalidation webhook for WordPress content changes
// Configure WP Webhooks plugin to call this endpoint on post publish/update/delete

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// Revalidation secret - set this in Vercel environment variables
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'cursed-revalidate-2024';

export async function POST(request: NextRequest) {
  try {
    // Verify secret token
    const secret = request.headers.get('x-revalidate-secret') || 
                   request.nextUrl.searchParams.get('secret');
    
    if (secret !== REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Parse the webhook payload from WP Webhooks
    const body = await request.json();
    
    // WP Webhooks sends different payload structures
    // Handle common formats
    const postId = body.post_id || body.ID || body.id;
    const postSlug = body.post_name || body.slug || body.post?.slug;
    const postType = body.post_type || body.type || 'post';
    const action = body.action || body.event || 'update';

    console.log(`[Revalidate] Action: ${action}, Type: ${postType}, Slug: ${postSlug}, ID: ${postId}`);

    const revalidated: string[] = [];

    // Revalidate the specific post page
    if (postSlug) {
      revalidatePath(`/post/${postSlug}`);
      revalidated.push(`/post/${postSlug}`);
    }

    // Revalidate homepage (shows latest posts)
    revalidatePath('/');
    revalidated.push('/');

    // Revalidate category pages if categories are included
    if (body.categories && Array.isArray(body.categories)) {
      for (const cat of body.categories) {
        const catSlug = cat.slug || cat.category_nicename;
        if (catSlug) {
          revalidatePath(`/category/${catSlug}`);
          revalidated.push(`/category/${catSlug}`);
        }
      }
    }

    // Revalidate sitemap
    revalidatePath('/sitemap.xml');
    revalidated.push('/sitemap.xml');

    // If using tags for cache invalidation
    revalidateTag('posts');
    revalidateTag('homepage');

    return NextResponse.json({
      success: true,
      revalidated,
      timestamp: new Date().toISOString(),
      post: {
        id: postId,
        slug: postSlug,
        type: postType,
        action
      }
    });

  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return NextResponse.json(
      { 
        error: 'Revalidation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support GET for simple testing
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const path = request.nextUrl.searchParams.get('path');

  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (path) {
    revalidatePath(path);
    return NextResponse.json({ 
      success: true, 
      revalidated: [path],
      timestamp: new Date().toISOString()
    });
  }

  return NextResponse.json({ 
    status: 'ready',
    message: 'Add ?path=/post/your-slug to revalidate a specific path'
  });
}
