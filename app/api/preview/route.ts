import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PREVIEW_SECRET = process.env.PREVIEW_SECRET;

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitInfo(ip: string): { isAllowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { isAllowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { isAllowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { isAllowed: true, remaining: MAX_REQUESTS_PER_WINDOW - entry.count, resetTime: entry.resetTime };
}

if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, RATE_LIMIT_WINDOW_MS);
}

const previewQuerySchema = z.object({
  secret: z.string().min(1, 'Secret is required').max(256, 'Secret too long'),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  type: z.enum(['post', 'category', 'page']).default('post'),
});

/**
 * Extract client IP for rate limiting.
 * 
 * Security model:
 * - Primary protection: PREVIEW_SECRET authentication (required)
 * - Rate limiting: Defense-in-depth against brute force attempts
 * 
 * On Vercel (target platform): x-real-ip is set by Vercel's edge network and cannot be spoofed.
 * For other platforms: Consider adding request.ip or socket.remoteAddress if available.
 */
function getClientIP(request: NextRequest): string {
  // @ts-expect-error - request.ip exists in Vercel runtime
  if (request.ip) {
    // @ts-expect-error - request.ip exists in Vercel runtime
    return request.ip;
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim()).filter(Boolean);
    if (ips.length > 0) {
      return ips[ips.length - 1];
    }
  }
  
  return 'unknown';
}

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);

  const rateLimit = getRateLimitInfo(ip);
  
  if (!rateLimit.isAllowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
        }
      }
    );
  }
  const searchParams = request.nextUrl.searchParams;
  
  const parseResult = previewQuerySchema.safeParse({
    secret: searchParams.get('secret'),
    slug: searchParams.get('slug'),
    type: searchParams.get('type') || 'post',
  });

  if (!parseResult.success) {
    const errors = parseResult.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: 'Invalid request parameters', details: errors },
      { status: 400 }
    );
  }

  const { secret, slug, type } = parseResult.data;

  if (!PREVIEW_SECRET) {
    return NextResponse.json(
      { error: 'Preview mode not configured' },
      { status: 500 }
    );
  }

  if (secret !== PREVIEW_SECRET) {
    return NextResponse.json(
      { error: 'Invalid preview token' },
      { status: 401 }
    );
  }

  const draft = await draftMode();
  draft.enable();

  const redirectPath = type === 'category' ? `/category/${slug}` : `/post/${slug}`;
  redirect(redirectPath);
}
