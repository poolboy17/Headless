import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

const PREVIEW_SECRET = process.env.PREVIEW_SECRET;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const type = searchParams.get('type') || 'post';

  if (!PREVIEW_SECRET) {
    return new Response('Preview mode not configured', { status: 500 });
  }

  if (secret !== PREVIEW_SECRET) {
    return new Response('Invalid preview token', { status: 401 });
  }

  if (!slug) {
    return new Response('Missing slug parameter', { status: 400 });
  }

  const draft = await draftMode();
  draft.enable();

  const redirectPath = type === 'category' ? `/category/${slug}` : `/post/${slug}`;
  redirect(redirectPath);
}
