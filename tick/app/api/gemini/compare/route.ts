import { NextResponse } from 'next/server';
import { generateCompareVerdict } from '@/lib/gemini';
import { getOrSet } from '@/lib/cache';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stockA, stockB } = body;

    if (!stockA?.symbol || !stockB?.symbol) {
      return NextResponse.json(
        { error: 'stockA and stockB with symbols are required' },
        { status: 400 },
      );
    }

    const sorted = [stockA.symbol, stockB.symbol].sort().join(':');
    const bodyHash = crypto.createHash('md5').update(JSON.stringify(body)).digest('hex');
    const cacheKey = `gemini:compare:${sorted}:${bodyHash}`;
    const ttlMs = 6 * 60 * 60 * 1000; // 6 hours

    const result = await getOrSet(cacheKey, ttlMs, () =>
      generateCompareVerdict(body),
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Gemini compare route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate comparison verdict' },
      { status: 500 },
    );
  }
}
