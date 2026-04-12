import { NextResponse } from 'next/server';
import { getRecentNews } from '@/lib/newsapi';
import { getOrSet } from '@/lib/cache';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    
    // 30 min cache TTL
    const ttlMs = 30 * 60 * 1000;
    const cacheKey = `news:${symbol.toUpperCase()}`;

    const news = await getOrSet(cacheKey, ttlMs, () => getRecentNews(symbol));

    return NextResponse.json(news);
  } catch (error: any) {
    console.error('News route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
