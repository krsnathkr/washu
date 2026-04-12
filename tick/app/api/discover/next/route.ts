import { NextResponse } from 'next/server';
import { getNextTicker } from '@/lib/tickerUniverse';

export const dynamic = 'force-dynamic'; // Prevent static caching of the random result

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const excludeParam = url.searchParams.get('exclude') || '';
    const exclude = excludeParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

    const nextTicker = getNextTicker(exclude);

    if (!nextTicker) {
      return NextResponse.json({ error: 'Universe exhausted' }, { status: 404 });
    }

    return NextResponse.json({ symbol: nextTicker });
  } catch (error: any) {
    console.error('Discover next route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch next ticker' },
      { status: 500 }
    );
  }
}
