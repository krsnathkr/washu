import { NextResponse } from 'next/server';
import { generateBullBear } from '@/lib/gemini';
import { getOrSet } from '@/lib/cache';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const symbol = body.symbol || 'UNKNOWN';

    // Hash the context payload to create a deterministic cache key
    const bodyHash = crypto.createHash('md5').update(JSON.stringify(body)).digest('hex');
    const cacheKey = `bullbear:${symbol.toUpperCase()}:${bodyHash}`;
    const ttlMs = 6 * 60 * 60 * 1000; // 6 hours TTL

    const result = await getOrSet(cacheKey, ttlMs, () => generateBullBear(body));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Bull/Bear route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate bull/bear analysis' },
      { status: 500 }
    );
  }
}
