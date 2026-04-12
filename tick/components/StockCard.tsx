import { memo } from "react";
import { useStockCard } from "@/lib/useStockCard";
import { ChartPanel } from "./ChartPanel";
import { StatsGrid } from "./StatsGrid";
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
    <div className="w-full h-full max-w-5xl bg-card text-card-foreground rounded-3xl shadow-xl border border-border/50 overflow-hidden flex flex-col max-h-[85vh]" style={{ contain: "layout style paint" }}>
      {/* Scrollable Container inside the card */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        
        {/* Header */}
        <div className="px-5 pt-6 pb-2">
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
            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold tracking-tight">{sData.symbol}</h1>
                <p className="text-sm text-muted-foreground line-clamp-1">{sData.name}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-bold">${sData.price.toFixed(2)}</span>
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
        <ChartPanel symbol={symbol} initialChart={sData?.chart || null} />
        
        {sData?.summary && (
          <div className="px-5 py-3 border-y border-border/50">
            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
              {sData.summary}
            </p>
          </div>
        )}

        <StatsGrid stats={sData} />
        <BullBearPanel data={isMismatchedStock ? null : bullbear.data} loading={isMismatchedStock || bullbear.loading} />
        <SentimentPanel data={isMismatchedStock ? null : sentiment.data} loading={isMismatchedStock || sentiment.loading} />
        <NewsPanel news={isMismatchedStock ? null : news.data} loading={isMismatchedStock || news.loading} />
        
      </div>
    </div>
  );
});
