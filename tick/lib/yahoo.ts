import YahooFinance from 'yahoo-finance2';
import { StockSnapshot, ChartPoint } from './types';

const yahooFinance = new YahooFinance();

export type ChartRange = '1D' | '1W' | '1M' | '1Y';

export async function getStockSnapshot(symbol: string, range: ChartRange = '1M'): Promise<StockSnapshot> {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const rangeMap: Record<ChartRange, { period1: Date; interval: "5m" | "15m" | "1d" }> = {
    '1D': { period1: new Date(now.getTime() - 1 * day), interval: '5m' },
    '1W': { period1: new Date(now.getTime() - 7 * day), interval: '15m' },
    '1M': { period1: new Date(now.getTime() - 30 * day), interval: '1d' },
    '1Y': { period1: new Date(now.getTime() - 365 * day), interval: '1d' },
  };

  const { period1, interval } = rangeMap[range];

  const [quote, chartResult] = await Promise.all([
    yahooFinance.quote(symbol),
    yahooFinance
      .chart(symbol, { period1, interval })
      .catch(() => null),
  ]);

  const profile = await yahooFinance
    .quoteSummary(symbol, { modules: ['summaryProfile'] })
    .catch(() => null);

  const chartInfo = chartResult?.quotes || [];
  const chart: ChartPoint[] = chartInfo
    .filter((c: any) => c.close !== null)
    .map((c: any) => ({
      time: Math.floor(c.date.getTime() / 1000), // lightweight-charts expects unix timestamps in seconds
      value: c.close as number
    }));

  return {
    symbol: quote.symbol || symbol,
    name: quote.longName || quote.shortName || symbol,
    price: quote.regularMarketPrice ?? 0,
    change: quote.regularMarketChange ?? 0,
    changePct: quote.regularMarketChangePercent ?? 0,
    pe: quote.forwardPE ?? quote.trailingPE ?? null,
    marketCap: quote.marketCap ?? null,
    week52High: quote.fiftyTwoWeekHigh ?? null,
    week52Low: quote.fiftyTwoWeekLow ?? null,
    divYield: quote.dividendYield ?? null,
    beta: quote.beta ?? null,
    volume: quote.regularMarketVolume ?? null,
    summary: profile?.summaryProfile?.longBusinessSummary || 'No summary available.',
    chart
  };
}
