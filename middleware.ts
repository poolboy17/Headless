import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  
  // Handle ?p=ID WordPress legacy URLs
  const postId = searchParams.get('p');
  
  if (pathname === '/' && postId) {
    try {
      // Look up the post in WordPress to get the slug
      const response = await fetch(
        `https://wp.cursedtours.com/wp-json/wp/v2/posts/${postId}?_fields=slug`
      );
      
      if (response.ok) {
        const post = await response.json();
        if (post.slug) {
          // 301 redirect to clean URL
          return NextResponse.redirect(
            new URL(`/${post.slug}/`, request.url),
            301
          );
        }
      }
      
      // Post not found - return 404
      return NextResponse.rewrite(new URL('/404', request.url));
      
    } catch (error) {
      // API error - return 404
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }
  
  return NextResponse.next();
}
