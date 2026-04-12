import YahooFinance from 'yahoo-finance2';
import {
  StockSnapshot,
  ChartPoint,
  CompareFinancials,
  AnalystRating,
  AnalystRecommendationBreakdown,
} from './types';

const yahooFinance = new YahooFinance();

export type ChartRange = '1D' | '1W' | '1M' | '1Y';
type ChartInterval = "5m" | "15m" | "1d";

type YahooChartQuote = {
  date: Date;
  high: number | null;
  low: number | null;
  open: number | null;
  close: number | null;
};

type YahooRecommendationTrendPoint = AnalystRecommendationBreakdown & {
  period: string;
};

function trimToLatestSession(quotes: YahooChartQuote[], timeZone?: string) {
  const populatedQuotes = quotes.filter((quote) => quote.close !== null);

  if (populatedQuotes.length === 0) {
    return [];
  }

  const sessionFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone ?? "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const latestSession = sessionFormatter.format(
    populatedQuotes[populatedQuotes.length - 1].date
  );

  return populatedQuotes.filter(
    (quote) => sessionFormatter.format(quote.date) === latestSession
  );
}

async function getChartWithFallback(symbol: string, period1: Date, intervals: ChartInterval[]) {
  for (const interval of intervals) {
    try {
      const result = await yahooFinance.chart(symbol, { period1, interval });
      const hasData = result.quotes.some((quote) => quote.close !== null);

      if (hasData) {
        return result;
      }
    } catch (error) {
      console.warn(`Yahoo chart fetch failed for ${symbol} at interval ${interval}`, error);
    }
  }

  return null;
}

function getLatestRecommendationBreakdown(
  trend: YahooRecommendationTrendPoint[] | undefined
): AnalystRecommendationBreakdown | null {
  const latestTrend = trend?.find((entry) => entry.period === "0m") ?? trend?.[0];

  if (!latestTrend) {
    return null;
  }

  return {
    strongBuy: latestTrend.strongBuy ?? 0,
    buy: latestTrend.buy ?? 0,
    hold: latestTrend.hold ?? 0,
    sell: latestTrend.sell ?? 0,
    strongSell: latestTrend.strongSell ?? 0,
  };
}

function buildAnalystRating(params: {
  recommendationKey?: string | null;
  recommendationMean?: number | null;
  numberOfAnalystOpinions?: number | null;
  targetMeanPrice?: number | null;
  distribution: AnalystRecommendationBreakdown | null;
}): AnalystRating | null {
  const {
    recommendationKey,
    recommendationMean,
    numberOfAnalystOpinions,
    targetMeanPrice,
    distribution,
  } = params;

  if (
    recommendationKey == null &&
    recommendationMean == null &&
    numberOfAnalystOpinions == null &&
    targetMeanPrice == null &&
    distribution == null
  ) {
    return null;
  }

  return {
    recommendationKey: recommendationKey ?? null,
    recommendationMean: recommendationMean ?? null,
    numberOfAnalystOpinions: numberOfAnalystOpinions ?? null,
    targetMeanPrice: targetMeanPrice ?? null,
    distribution,
  };
}

export async function getStockSnapshot(symbol: string, range: ChartRange = '1M'): Promise<StockSnapshot> {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const rangeMap: Record<ChartRange, { period1: Date; intervals: ChartInterval[] }> = {
    '1D': { period1: new Date(now.getTime() - 7 * day), intervals: ['5m', '15m'] },
    '1W': { period1: new Date(now.getTime() - 7 * day), intervals: ['15m', '1d'] },
    '1M': { period1: new Date(now.getTime() - 30 * day), intervals: ['1d'] },
    '1Y': { period1: new Date(now.getTime() - 365 * day), intervals: ['1d'] },
  };

  const { period1, intervals } = rangeMap[range];

  const [quote, chartResult, summary] = await Promise.all([
    yahooFinance.quote(symbol),
    getChartWithFallback(symbol, period1, intervals),
    yahooFinance
      .quoteSummary(symbol, { modules: ['summaryProfile', 'financialData', 'recommendationTrend'] })
      .catch(() => null),
  ]);

  const chartTimeZone = chartResult?.meta.exchangeTimezoneName;
  const chartInfo = (chartResult?.quotes ?? []) as YahooChartQuote[];
  const normalizedChartInfo = range === '1D'
    ? trimToLatestSession(chartInfo, chartTimeZone)
    : chartInfo.filter((quote) => quote.close !== null);
  const financialData = summary?.financialData;
  const analystRating = buildAnalystRating({
    recommendationKey: financialData?.recommendationKey,
    recommendationMean: financialData?.recommendationMean,
    numberOfAnalystOpinions: financialData?.numberOfAnalystOpinions,
    targetMeanPrice: financialData?.targetMeanPrice,
    distribution: getLatestRecommendationBreakdown(
      summary?.recommendationTrend?.trend as YahooRecommendationTrendPoint[] | undefined
    ),
  });

  const chart: ChartPoint[] = normalizedChartInfo
    .map((c) => ({
      time: Math.floor(c.date.getTime() / 1000), // lightweight-charts expects unix timestamps in seconds
      value: c.close as number,
      open: c.open ?? undefined,
      high: c.high ?? undefined,
      low: c.low ?? undefined,
      close: c.close ?? undefined,
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
    summary: summary?.summaryProfile?.longBusinessSummary || 'No summary available.',
    analystRating,
    chart
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
