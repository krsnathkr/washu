import YahooFinance from 'yahoo-finance2';
import { StockSnapshot, ChartPoint, CompareFinancials } from './types';

const yahooFinance = new YahooFinance();

export type ChartRange = '1D' | '1W' | '1M' | '1Y';

/** Annualized historical volatility from daily closing prices */
function computeAnnualizedVol(chart: ChartPoint[]): number | null {
  if (chart.length < 5) return null;
  const returns: number[] = [];
  for (let i = 1; i < chart.length; i++) {
    const prev = chart[i - 1].value;
    const curr = chart[i].value;
    if (prev > 0 && curr > 0) returns.push(Math.log(curr / prev));
  }
  if (returns.length < 4) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance) * Math.sqrt(252);
}

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

  const annualVol = computeAnnualizedVol(chart);
  const beta = quote.beta ?? null;
  // Flag volatile when annualized vol ≥ 40%, or fall back to beta ≥ 1.8 if
  // chart data is too sparse for a reliable vol calculation.
  const volatile = annualVol !== null ? annualVol >= 0.40 : (beta !== null && beta >= 1.8);

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
    beta,
    volume: quote.regularMarketVolume ?? null,
    summary: profile?.summaryProfile?.longBusinessSummary || 'No summary available.',
    chart,
    volatile,
  };
}

/** Lightweight fetch for comparison — quote + financialData, no chart */
export async function getCompareFinancials(symbol: string): Promise<CompareFinancials> {
  const [quote, summary] = await Promise.all([
    yahooFinance.quote(symbol),
    yahooFinance
      .quoteSummary(symbol, { modules: ['financialData'] })
      .catch(() => null),
  ]);

  const fd = summary?.financialData;

  return {
    symbol: quote.symbol || symbol,
    name: quote.longName || quote.shortName || symbol,
    price: quote.regularMarketPrice ?? 0,
    change: quote.regularMarketChange ?? 0,
    changePct: quote.regularMarketChangePercent ?? 0,
    pe: quote.forwardPE ?? quote.trailingPE ?? null,
    marketCap: quote.marketCap ?? null,
    revenueGrowth: fd?.revenueGrowth ?? null,
    earningsGrowth: fd?.earningsGrowth ?? null,
    profitMargin: fd?.profitMargins ?? null,
    debtToEquity: fd?.debtToEquity ?? null,
    week52High: quote.fiftyTwoWeekHigh ?? null,
    week52Low: quote.fiftyTwoWeekLow ?? null,
    divYield: quote.dividendYield ?? null,
    beta: quote.beta ?? null,
  };
}
