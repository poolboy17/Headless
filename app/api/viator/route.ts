import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const WORDPRESS_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://wp.cursedtours.com';

const apiKeySchema = z.string().min(1, 'API key is required');

export async function GET() {
  try {
    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/viator-sync/v1/status`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch sync status', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Viator sync status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminApiKey = process.env.ADMIN_API_KEY;
    
    if (!adminApiKey) {
      console.error('ADMIN_API_KEY not configured');
      return NextResponse.json(
        { error: 'Admin authentication not configured' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const url = new URL(request.url);
    const queryApiKey = url.searchParams.get('api_key');
    
    let providedKey: string | null = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      providedKey = authHeader.substring(7);
    } else if (queryApiKey) {
      providedKey = queryApiKey;
    }

    const keyParseResult = apiKeySchema.safeParse(providedKey);
    
    if (!keyParseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: { api_key: ['API key is required'] } },
        { status: 400 }
      );
    }

    if (keyParseResult.data !== adminApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized - valid admin API key required' },
        { status: 401 }
      );
    }

    const wpUsername = process.env.WP_USERNAME;
    const wpAppPassword = process.env.WP_APP_PASSWORD;

    if (!wpUsername || !wpAppPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials not configured' },
        { status: 500 }
      );
    }

    const wpAuthHeader = Buffer.from(`${wpUsername}:${wpAppPassword}`).toString('base64');

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/viator-sync/v1/sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${wpAuthHeader}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress sync error:', errorText);
      return NextResponse.json(
        { error: 'Failed to trigger sync', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      message: 'Sync triggered successfully',
      ...data,
    });
  } catch (error) {
    console.error('Error triggering Viator sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
