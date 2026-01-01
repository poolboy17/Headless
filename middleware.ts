import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const postId = searchParams.get('p');

  // Handle legacy ?p=ID WordPress URLs
  if (postId && request.nextUrl.pathname === '/') {
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
    } catch {
      // Fall through to homepage if lookup fails
    }
    // If post not found, redirect to homepage without ?p=
    return NextResponse.redirect(new URL('/', request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only run on homepage with query params
    '/',
  ],
};
