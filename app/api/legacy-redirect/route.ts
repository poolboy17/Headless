import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get('p');
  
  if (!postId) {
    return NextResponse.redirect(new URL('/', request.url), 301);
  }
  
  try {
    const response = await fetch(
      `https://wp.cursedtours.com/wp-json/wp/v2/posts/${postId}?_fields=slug`
    );
    
    if (response.ok) {
      const post = await response.json();
      if (post.slug) {
        return NextResponse.redirect(
          new URL(`/${post.slug}/`, request.url),
          301
        );
      }
    }
    
    // Post not found
    return NextResponse.redirect(new URL('/404', request.url), 302);
    
  } catch (error) {
    return NextResponse.redirect(new URL('/404', request.url), 302);
  }
}
