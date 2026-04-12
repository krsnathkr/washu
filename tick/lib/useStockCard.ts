import { useEffect, useMemo, useRef, useState } from "react";
import type { StockSnapshot, NewsItem, BullBear, SentimentSummary } from "./types";

export interface StockCardData {
  stock: { data: StockSnapshot | null; loading: boolean; error: Error | null };
  news: { data: NewsItem[] | null; loading: boolean; error: Error | null };
  bullbear: { data: BullBear | null; loading: boolean; error: Error | null };
  sentiment: { data: SentimentSummary | null; loading: boolean; error: Error | null };
}

const frontendCache = new Map<string, StockCardData>();

function createEmptyCardData(): StockCardData {
  return {
    stock: { data: null, loading: false, error: null },
    news: { data: null, loading: false, error: null },
    bullbear: { data: null, loading: false, error: null },
    sentiment: { data: null, loading: false, error: null },
  };
}

function createLoadingCardData(): StockCardData {
  return {
    stock: { data: null, loading: true, error: null },
    news: { data: null, loading: true, error: null },
    bullbear: { data: null, loading: true, error: null },
    sentiment: { data: null, loading: true, error: null },
  };
}

export function useStockCard(symbol: string | null) {
  const activeRequestIdRef = useRef(0);
  const [resolved, setResolved] = useState<{ symbol: string | null; data: StockCardData }>(() => {
    if (symbol && frontendCache.has(symbol)) {
      return { symbol, data: frontendCache.get(symbol)! };
    }

    return {
      symbol,
      data: symbol ? createLoadingCardData() : createEmptyCardData(),
    };
  });

  const data = useMemo(() => {
    if (!symbol) return createEmptyCardData();
    if (resolved.symbol === symbol) return resolved.data;

    const cached = frontendCache.get(symbol);
    return cached ?? createLoadingCardData();
  }, [resolved, symbol]);

  useEffect(() => {
    if (!symbol || frontendCache.has(symbol)) return;

    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    const requestSymbol = symbol;
    let nextData = createLoadingCardData();

    const commit = (updater: (prev: StockCardData) => StockCardData) => {
      nextData = updater(nextData);
      frontendCache.set(requestSymbol, nextData);

      if (activeRequestIdRef.current !== requestId) return;
      setResolved({ symbol: requestSymbol, data: nextData });
    };

    // 1. Fetch stock + news in parallel
    const pStock = fetch(`/api/stock/${requestSymbol}`).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch stock");
      return res.json() as Promise<StockSnapshot>;
    });

    const pNews = fetch(`/api/news/${requestSymbol}`).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json() as Promise<NewsItem[]>;
    });

    pStock
      .then((stockData) => {
        commit((prev) => ({ ...prev, stock: { data: stockData, loading: false, error: null } }));
      })
      .catch((err) => {
        commit((prev) => ({ ...prev, stock: { data: null, loading: false, error: err as Error } }));
      });

    pNews
      .then((newsData) => {
        commit((prev) => ({ ...prev, news: { data: newsData, loading: false, error: null } }));
      })
      .catch((err) => {
        commit((prev) => ({ ...prev, news: { data: null, loading: false, error: err as Error } }));
      });

    // 2. Fetch sentiment
    const pSentiment = fetch(`/api/reddit/${requestSymbol}`).then((res) => {
      if (!res.ok) throw new Error("Failed to fetch sentiment");
      return res.json() as Promise<SentimentSummary>;
    });

    pSentiment
      .then((sentimentData) => {
        commit((prev) => ({ ...prev, sentiment: { data: sentimentData, loading: false, error: null } }));
      })
      .catch((err) => {
        commit((prev) => ({ ...prev, sentiment: { data: null, loading: false, error: err as Error } }));
      });

    // 3. Chain bullbear after stock and news arrive for context
    Promise.allSettled([pStock, pNews]).then((results) => {
      const stockRes = results[0].status === "fulfilled" ? results[0].value : null;
      const newsRes = results[1].status === "fulfilled" ? results[1].value : [];

      fetch("/api/gemini/bullbear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: requestSymbol,
          name: stockRes?.name,
          stats: stockRes,
          headlines: newsRes.map((n) => n.title).slice(0, 5),
        }),
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json() as Promise<BullBear>;
      })
      .then((bbData) => {
        commit((prev) => ({ ...prev, bullbear: { data: bbData, loading: false, error: null } }));
      })
      .catch((err) => {
        commit((prev) => ({ ...prev, bullbear: { data: null, loading: false, error: err as Error } }));
      });
    });

    return () => {
      if (activeRequestIdRef.current === requestId) {
        activeRequestIdRef.current += 1;
      }
    };
  }, [symbol]);

  return data;
}
