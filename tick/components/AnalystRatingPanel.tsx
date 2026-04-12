import { memo } from "react";
import { cn } from "@/lib/utils";
import { AnalystRating } from "@/lib/types";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Minus,
  Target,
  Users,
} from "lucide-react";

const DISTRIBUTION_SEGMENTS = [
  { key: "strongBuy", label: "Strong Buy", fillClass: "bg-chart-1" },
  { key: "buy", label: "Buy", fillClass: "bg-chart-1/70" },
  { key: "hold", label: "Hold", fillClass: "bg-chart-4" },
  { key: "sell", label: "Sell", fillClass: "bg-chart-2/70" },
  { key: "strongSell", label: "Strong Sell", fillClass: "bg-destructive" },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getRecommendationLabel(recommendationKey: string | null, recommendationMean: number | null) {
  const normalizedKey = recommendationKey?.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (normalizedKey && normalizedKey !== "none" && normalizedKey !== "n_a") {
    return toTitleCase(normalizedKey);
  }

  if (recommendationMean == null) {
    return "No Rating";
  }

  if (recommendationMean <= 1.5) return "Strong Buy";
  if (recommendationMean <= 2.5) return "Buy";
  if (recommendationMean <= 3.5) return "Hold";
  if (recommendationMean <= 4.5) return "Underperform";
  return "Sell";
}

function getTone(recommendationKey: string | null, recommendationMean: number | null) {
  const normalizedKey = recommendationKey?.trim().toLowerCase().replace(/[\s-]+/g, "_");

  if (
    normalizedKey &&
    ["strong_buy", "buy", "outperform", "overweight", "positive"].includes(normalizedKey)
  ) {
    return {
      badgeClass: "border-chart-1/20 bg-chart-1/12 text-chart-1",
      markerClass: "bg-chart-1",
      moveClass: "text-chart-1",
    };
  }

  if (
    normalizedKey &&
    ["hold", "neutral", "market_perform", "equal_weight"].includes(normalizedKey)
  ) {
    return {
      badgeClass: "border-chart-4/25 bg-chart-4/12 text-chart-4",
      markerClass: "bg-chart-4",
      moveClass: "text-chart-4",
    };
  }

  if (
    normalizedKey &&
    ["underperform", "sell", "underweight", "negative", "reduce"].includes(normalizedKey)
  ) {
    return {
      badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
      markerClass: "bg-destructive",
      moveClass: "text-destructive",
    };
  }

  if (recommendationMean != null) {
    if (recommendationMean <= 2.5) {
      return {
        badgeClass: "border-chart-1/20 bg-chart-1/12 text-chart-1",
        markerClass: "bg-chart-1",
        moveClass: "text-chart-1",
      };
    }

    if (recommendationMean <= 3.5) {
      return {
        badgeClass: "border-chart-4/25 bg-chart-4/12 text-chart-4",
        markerClass: "bg-chart-4",
        moveClass: "text-chart-4",
      };
    }
  }

  return {
    badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
    markerClass: "bg-destructive",
    moveClass: "text-destructive",
  };
}

function formatCurrency(value: number | null) {
  if (value == null) return "-";
  return `$${value.toFixed(2)}`;
}

function formatPercent(value: number | null) {
  if (value == null) return "-";
  return `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

export const AnalystRatingPanel = memo(function AnalystRatingPanel({
  data,
  loading,
  currentPrice,
}: {
  data: AnalystRating | null;
  loading: boolean;
  currentPrice: number | null;
}) {
  if (loading && !data) {
    return (
      <div className="border-t border-border px-4 py-4 bg-gradient-to-b from-transparent to-muted/10">
        <div className="rounded-[1.4rem] border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
              <div className="h-3 w-28 rounded bg-muted animate-pulse" />
            </div>
            <div className="flex flex-col gap-3 md:grid md:grid-cols-[1.4fr_1fr]">
              <div className="flex flex-col gap-3">
                <div className="h-8 w-36 rounded-full bg-muted animate-pulse" />
                <div className="h-9 w-40 rounded bg-muted animate-pulse" />
                <div className="h-4 w-56 rounded bg-muted animate-pulse" />
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/50 p-3">
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-5 rounded bg-muted animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
            <div className="h-16 rounded-2xl bg-muted/70 animate-pulse" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-20 rounded-2xl bg-muted/70 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border-t border-border px-4 py-4 bg-gradient-to-b from-transparent to-muted/10">
        <div className="rounded-[1.4rem] border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            Analyst rating unavailable.
          </div>
        </div>
      </div>
    );
  }

  const label = getRecommendationLabel(data.recommendationKey, data.recommendationMean);
  const tone = getTone(data.recommendationKey, data.recommendationMean);
  const score = data.recommendationMean != null ? clamp(data.recommendationMean, 1, 5) : null;
  const meterPosition = score != null ? ((score - 1) / 4) * 100 : null;
  const impliedMove =
    data.targetMeanPrice != null && currentPrice != null && currentPrice > 0
      ? (data.targetMeanPrice - currentPrice) / currentPrice
      : null;
  const MoveIcon = impliedMove == null ? Minus : impliedMove >= 0 ? ArrowUpRight : ArrowDownRight;
  const moveClass =
    impliedMove == null
      ? "text-muted-foreground"
      : impliedMove >= 0
        ? "text-chart-1"
        : "text-destructive";
  const breakdownTotal = data.distribution
    ? Object.values(data.distribution).reduce((sum, value) => sum + value, 0)
    : 0;
  const analystCount =
    data.numberOfAnalystOpinions ?? (breakdownTotal > 0 ? breakdownTotal : null);

  return (
    <div className="border-t border-border px-4 py-4 bg-gradient-to-b from-transparent to-muted/10">
      <div className="rounded-[1.4rem] border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:grid md:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                <BarChart3 className="h-3.5 w-3.5" />
                Analyst Rating
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-3">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]",
                    tone.badgeClass
                  )}
                >
                  {label}
                </span>

                {score != null && (
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-semibold tracking-tight">{score.toFixed(1)}</span>
                    <span className="pb-1 text-sm text-muted-foreground">/ 5 consensus</span>
                  </div>
                )}
              </div>

              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                {analystCount != null
                  ? `Consensus based on ${analystCount} analyst opinions.`
                  : "Consensus snapshot sourced from Yahoo Finance."}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/55 p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Analysts
                  </span>
                  <span className="font-semibold">{analystCount ?? "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    Mean Target
                  </span>
                  <span className="font-semibold">{formatCurrency(data.targetMeanPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <MoveIcon className={cn("h-4 w-4", moveClass)} />
                    Implied Move
                  </span>
                  <span className={cn("font-semibold", moveClass)}>
                    {formatPercent(impliedMove)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {meterPosition != null && (
            <div className="rounded-2xl border border-border/60 bg-background/55 p-3">
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                <span>Strong Buy</span>
                <span>Hold</span>
                <span>Sell</span>
              </div>

              <div className="relative mt-3">
                <div className="grid h-3 grid-cols-5 gap-px overflow-hidden rounded-full bg-muted/60">
                  {DISTRIBUTION_SEGMENTS.map((segment) => (
                    <div key={segment.key} className={segment.fillClass} />
                  ))}
                </div>

                <div
                  className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-card shadow-sm"
                  style={{ left: `${meterPosition}%` }}
                >
                  <span
                    className={cn("absolute inset-[3px] rounded-full", tone.markerClass)}
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>1.0</span>
                <span>Lower is more bullish</span>
                <span>5.0</span>
              </div>
            </div>
          )}

          {data.distribution && breakdownTotal > 0 && (
            <div className="rounded-2xl border border-border/60 bg-background/55 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Consensus Breakdown</h3>
                <span className="text-xs text-muted-foreground">{breakdownTotal} total ratings</span>
              </div>

              <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-muted/70">
                {DISTRIBUTION_SEGMENTS.map((segment) => {
                  const count = data.distribution?.[segment.key] ?? 0;

                  if (count === 0) {
                    return null;
                  }

                  return (
                    <div
                      key={segment.key}
                      className={segment.fillClass}
                      style={{ width: `${(count / breakdownTotal) * 100}%` }}
                    />
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {DISTRIBUTION_SEGMENTS.map((segment) => {
                  const count = data.distribution?.[segment.key] ?? 0;

                  return (
                    <div
                      key={segment.key}
                      className="rounded-2xl border border-border/50 bg-card/70 p-3"
                    >
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        <span className={cn("h-2.5 w-2.5 rounded-full", segment.fillClass)} />
                        {segment.label}
                      </div>
                      <div className="mt-2 text-2xl font-semibold tracking-tight">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
