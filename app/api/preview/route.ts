import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const PREVIEW_SECRET = process.env.PREVIEW_SECRET;

const previewQuerySchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  type: z.enum(['post', 'category', 'page']).default('post'),
});

export async function GET(request: NextRequest) {
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
