import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;
  
  // Handle ?p=ID WordPress legacy URLs
  const postId = searchParams.get('p');
  
  if (pathname === '/' && postId) {
    // For now, just redirect to 404 to test if middleware runs
    return NextResponse.redirect(new URL('/not-found-test', request.url), 302);
  }
  
  return NextResponse.next();
}
