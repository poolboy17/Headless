// app/api/webhooks/rebuild-links/route.ts
// Webhook endpoint to rebuild internal link index when WordPress posts change

import { NextRequest, NextResponse } from 'next/server';

const WORKER_URL = 'https://internal-linker-sidecar.genaromvasquez.workers.dev';
const REBUILD_KEY = 'cursed2024'; // Same key as in Worker

export async function POST(request: NextRequest) {
  try {
    // Optional: Verify webhook secret from WordPress
    const webhookSecret = request.headers.get('x-webhook-secret');
    
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    console.log('Rebuilding internal link index...');

    // Call Worker to rebuild index
    const response = await fetch(
      `${WORKER_URL}/api/rebuild-index?key=${REBUILD_KEY}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      throw new Error(`Worker rebuild failed: ${response.status}`);
    }

    const data = await response.json();

    console.log('Index rebuilt:', data.stats);

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Internal link index rebuilt',
      stats: data.stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to rebuild index',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
