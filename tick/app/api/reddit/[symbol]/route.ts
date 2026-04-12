import { NextResponse } from 'next/server';
import { fetchRedditSentiment } from '@/lib/reddit';
import { getOrSet } from '@/lib/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const cacheKey = `reddit:${symbol.toUpperCase()}`;
    const ttlMs = 60 * 60 * 1000; // 1 hour TTL

    const result = await getOrSet(cacheKey, ttlMs, () => fetchRedditSentiment(symbol));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Reddit sentiment route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Reddit sentiment' },
      { status: 500 }
    );
  }
}
