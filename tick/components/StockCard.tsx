import { memo } from "react";
import { useStockCard } from "@/lib/useStockCard";
import { ChartPanel } from "./ChartPanel";
import { StatsGrid } from "./StatsGrid";
import { AnalystRatingPanel } from "./AnalystRatingPanel";
import { BullBearPanel } from "./BullBearPanel";
import { SentimentPanel } from "./SentimentPanel";
import { NewsPanel } from "./NewsPanel";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StockListMenu } from "./StockListMenu";

export const StockCard = memo(function StockCard({ symbol }: { symbol: string }) {
  const { stock, news, bullbear, sentiment } = useStockCard(symbol);

  // Header helpers
  const hasMatchingStock = stock.data?.symbol?.toUpperCase() === symbol.toUpperCase();
  const isMismatchedStock = Boolean(stock.data && !hasMatchingStock);
  const sData = hasMatchingStock ? stock.data : null;
  const showLoadingState = stock.loading || isMismatchedStock;
  const isUp = sData ? sData.change >= 0 : null;
  const changeColor = isUp === true ? "text-chart-1" : isUp === false ? "text-destructive" : "text-muted-foreground";
  const ChangeIcon = isUp === true ? TrendingUp : isUp === false ? TrendingDown : Minus;

  return (
    <div
      className="flex h-full max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-border/50 bg-card text-card-foreground shadow-xl sm:rounded-3xl"
      style={{ contain: "layout style paint" }}
    >
      {/* Scrollable Container inside the card */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        
        {/* Header */}
        <div className="px-4 pt-5 pb-3 sm:px-5 sm:pt-6 sm:pb-2">
          {showLoadingState && !sData ? (
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ) : sData ? (
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{sData.symbol}</h1>
                <p className="text-sm text-muted-foreground line-clamp-1">{sData.name}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xl font-bold sm:text-2xl">${sData.price.toFixed(2)}</span>
                  <span className={`text-sm font-semibold flex items-center gap-0.5 ${changeColor}`}>
                    <ChangeIcon className="w-3.5 h-3.5" />
                    {Math.abs(sData.change).toFixed(2)} ({Math.abs(sData.changePct * 100).toFixed(2)}%)
                  </span>
                </div>
                <StockListMenu symbol={sData.symbol} name={sData.name} />
              </div>
            </div>
          ) : (
             <div className="text-center py-4 text-destructive">Failed to load data</div>
          )}
        </div>

        {/* The Panels */}
        <ChartPanel key={symbol} symbol={symbol} initialChart={sData?.chart || null} />

        {sData?.summary && (
          <div className="border-y border-border/50 px-4 py-4 sm:px-5 sm:py-3">
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
              {sData.summary}
            </p>
          </div>
        )}

        <StatsGrid stats={sData} />
        <AnalystRatingPanel
          data={sData?.analystRating ?? null}
          loading={showLoadingState}
          currentPrice={sData?.price ?? null}
        />
        <BullBearPanel data={isMismatchedStock ? null : bullbear.data} loading={isMismatchedStock || bullbear.loading} />
        <SentimentPanel data={isMismatchedStock ? null : sentiment.data} loading={isMismatchedStock || sentiment.loading} />
        <NewsPanel news={isMismatchedStock ? null : news.data} loading={isMismatchedStock || news.loading} />
        
      </div>
    </div>
  );
});
