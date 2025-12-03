import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'production'
  });
}

export const runtime = 'edge';
