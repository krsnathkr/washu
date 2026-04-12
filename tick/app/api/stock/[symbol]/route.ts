import { NextResponse } from 'next/server';
import { getStockSnapshot, ChartRange } from '@/lib/yahoo';
import { getOrSet } from '@/lib/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const url = new URL(request.url);
    const range = (url.searchParams.get('range') || '1M') as ChartRange;

    const cacheKey = `stock:${symbol.toUpperCase()}:${range}`;
    const ttlMs = 15 * 60 * 1000; // 15 minutes TTL

    const snapshot = await getOrSet(cacheKey, ttlMs, () => getStockSnapshot(symbol, range));

    return NextResponse.json(snapshot);
  } catch (error: any) {
    console.error('Stock detail error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
}
