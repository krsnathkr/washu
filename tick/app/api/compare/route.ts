import { NextResponse } from 'next/server';
import { getCompareFinancials } from '@/lib/yahoo';
import { getOrSet } from '@/lib/cache';

export async function POST(request: Request) {
  try {
    const { symbolA, symbolB } = await request.json();

    if (!symbolA || !symbolB) {
      return NextResponse.json(
        { error: 'symbolA and symbolB are required' },
        { status: 400 },
      );
    }

    const a = symbolA.toUpperCase();
    const b = symbolB.toUpperCase();
    const cacheKey = `compare:${[a, b].sort().join(':')}`;
    const ttlMs = 15 * 60 * 1000; // 15 minutes

    const result = await getOrSet(cacheKey, ttlMs, () =>
      Promise.all([getCompareFinancials(a), getCompareFinancials(b)]).then(
        ([stockA, stockB]) => ({ stockA, stockB }),
      ),
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Compare route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch comparison data' },
      { status: 500 },
    );
  }
}
