import { SentimentSummary } from "@/lib/types";

export function SentimentPanel({ data, loading }: { data: SentimentSummary | null; loading: boolean }) {
  if (loading && !data) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Reddit Sentiment</h3>
          <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-3 w-5/6 bg-muted animate-pulse rounded ml-2" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Reddit Sentiment</h3>
        </div>
        <p className="text-sm text-muted-foreground ml-2">Sentiment analysis unavailable.</p>
      </div>
    );
  }

  // Determine pill style
  let pillClass = "bg-muted text-muted-foreground";
  if (data.label === "Bullish") pillClass = "bg-chart-1/10 text-chart-1 border border-chart-1/20";
  if (data.label === "Bearish") pillClass = "bg-destructive/10 text-destructive border border-destructive/20";
  if (data.label === "Mixed") pillClass = "bg-chart-4/10 text-chart-4 border border-chart-4/20";

  return (
    <div className="flex flex-col gap-3 px-4 py-4 border-t border-border bg-gradient-to-b from-transparent to-muted/10">
      <div className="flex items-center gap-3">
        <h3 className="font-semibold text-sm">Reddit Sentiment</h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest ${pillClass}`}>
          {data.label}
        </span>
      </div>
      {data.points && data.points.length > 0 ? (
        <ul className="text-sm space-y-1.5 ml-2 mt-1">
          {data.points.map((pt, idx) => (
            <li key={idx} className="text-muted-foreground flex items-start gap-2">
              <span className="text-muted-foreground/50 select-none">•</span>
              <span className="leading-snug">{pt}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground ml-2">No sentiment available.</p>
      )}
    </div>
  );
}
