import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WP_API_URL = 'https://wp.cursedtours.com/wp-json/wp/v2';

export async function GET() {
  try {
    const response = await fetch(
      `${WP_API_URL}/pages?per_page=100&_fields=id,slug,title,status`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 });
    }

    const pages = await response.json();

    return NextResponse.json({
      totalPages: pages.length,
      pages: pages.map((p: { id: number; slug: string; title: { rendered: string }; status: string }) => ({
        id: p.id,
        slug: p.slug,
        title: p.title.rendered,
        status: p.status,
        url: `/${p.slug}`
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch pages', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
