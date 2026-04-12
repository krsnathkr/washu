import { memo } from "react";
import { StockSnapshot } from "@/lib/types";

export const StatsGrid = memo(function StatsGrid({ stats }: { stats: StockSnapshot | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-4 py-4 text-sm sm:grid-cols-3 sm:px-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-3 w-12 bg-muted animate-pulse rounded" />
            <div className="h-5 w-20 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  const formatLarge = (num: number | null) => {
    if (num === null) return "-";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    return num.toLocaleString();
  };

  const items = [
    { label: "P/E Ratio", value: stats.pe ? stats.pe.toFixed(2) : "-" },
    { label: "Market Cap", value: formatLarge(stats.marketCap) },
    { label: "52W High", value: stats.week52High ? `$${stats.week52High.toFixed(2)}` : "-" },
    { label: "52W Low", value: stats.week52Low ? `$${stats.week52Low.toFixed(2)}` : "-" },
    { label: "Volume", value: formatLarge(stats.volume) },
    { label: "Div Yield", value: stats.divYield ? `${(stats.divYield * 100).toFixed(2)}%` : "-" },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5 px-4 py-4 text-sm sm:grid-cols-3 sm:px-5">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">{item.label}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
});
