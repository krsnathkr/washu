"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CompareData, CompareFinancials, CompareVerdict } from "@/lib/types";

interface CompareOverlayProps {
  data: CompareData | null;
  verdict: CompareVerdict | null;
  loading: boolean;
  verdictLoading: boolean;
  onClose: () => void;
}

const formatLarge = (num: number | null) => {
  if (num === null) return "—";
  if (num >= 1e12) return "$" + (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return "$" + (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return "$" + (num / 1e6).toFixed(2) + "M";
  return "$" + num.toLocaleString();
};

const formatPct = (num: number | null) => {
  if (num === null) return "—";
  return (num * 100).toFixed(1) + "%";
};

type CompareDir = "higher" | "lower" | "neutral";

interface MetricRow {
  label: string;
  valueA: string;
  valueB: string;
  rawA: number | null;
  rawB: number | null;
  better: CompareDir;
}

function getMetrics(a: CompareFinancials, b: CompareFinancials): MetricRow[] {
  const row = (
    label: string,
    rawA: number | null,
    rawB: number | null,
    fmt: (v: number | null) => string,
    better: CompareDir,
  ): MetricRow => ({
    label,
    valueA: fmt(rawA),
    valueB: fmt(rawB),
    rawA,
    rawB,
    better,
  });

  return [
    row("Revenue Growth", a.revenueGrowth, b.revenueGrowth, formatPct, "higher"),
    row("Earnings Growth", a.earningsGrowth, b.earningsGrowth, formatPct, "higher"),
    row("P/E Ratio", a.pe, b.pe, (v) => (v != null ? v.toFixed(2) : "—"), "lower"),
    row("Market Cap", a.marketCap, b.marketCap, formatLarge, "neutral"),
    row("Profit Margin", a.profitMargin, b.profitMargin, formatPct, "higher"),
    row("Debt / Equity", a.debtToEquity, b.debtToEquity, (v) => (v != null ? v.toFixed(1) : "—"), "lower"),
    row("Dividend Yield", a.divYield, b.divYield, formatPct, "higher"),
    row("Beta", a.beta, b.beta, (v) => (v != null ? v.toFixed(2) : "—"), "neutral"),
  ];
}

function winnerSide(row: MetricRow): "a" | "b" | null {
  if (row.better === "neutral" || row.rawA == null || row.rawB == null) return null;
  if (row.rawA === row.rawB) return null;
  if (row.better === "higher") return row.rawA > row.rawB ? "a" : "b";
  return row.rawA < row.rawB ? "a" : "b";
}

function StockHeader({ stock }: { stock: CompareFinancials }) {
  const isPositive = stock.change >= 0;
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-xl font-bold">{stock.symbol}</span>
      <span className="text-xs text-muted-foreground line-clamp-1">{stock.name}</span>
      <span className="mt-1 text-lg font-semibold">${stock.price.toFixed(2)}</span>
      <span className={`text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
        {isPositive ? "+" : ""}
        {stock.change.toFixed(2)} ({(stock.changePct * 100).toFixed(2)}%)
      </span>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <div className="space-y-3 px-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="h-5 bg-muted animate-pulse rounded" />
          <div className="h-4 w-20 bg-muted animate-pulse rounded" />
          <div className="h-5 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

function VerdictSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-48 bg-muted animate-pulse rounded mx-auto" />
      <div className="h-4 w-full bg-muted animate-pulse rounded" />
      <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
      <div className="h-4 w-full bg-muted animate-pulse rounded" />
      <div className="h-4 w-4/5 bg-muted animate-pulse rounded" />
    </div>
  );
}

export function CompareOverlay({
  data,
  verdict,
  loading,
  verdictLoading,
  onClose,
}: CompareOverlayProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const metrics = data ? getMetrics(data.stockA, data.stockB) : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4 py-8 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border/60 bg-card shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
            <h2 className="text-lg font-semibold">Stock Comparison</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close comparison"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="px-5 py-5 space-y-6">
            {/* Stock headers */}
            {loading ? (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
                <span className="text-xl font-bold text-muted-foreground">VS</span>
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ) : data ? (
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                <StockHeader stock={data.stockA} />
                <div className="flex flex-col items-center">
                  <span className="rounded-full bg-muted px-3 py-1 text-sm font-bold text-muted-foreground">
                    VS
                  </span>
                </div>
                <StockHeader stock={data.stockB} />
              </div>
            ) : null}

            {/* Metrics */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Key Metrics
              </h3>
              {loading ? (
                <MetricsSkeleton />
              ) : data ? (
                <div className="space-y-1">
                  {metrics.map((row) => {
                    const winner = winnerSide(row);
                    return (
                      <div
                        key={row.label}
                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-muted/40"
                      >
                        <div className="text-right">
                          <span
                            className={`text-sm font-medium ${
                              winner === "a"
                                ? "text-primary"
                                : winner === "b"
                                  ? "text-muted-foreground"
                                  : ""
                            }`}
                          >
                            {winner === "a" && <TrendingUp className="mr-1 inline size-3" />}
                            {row.valueA}
                          </span>
                        </div>
                        <span className="min-w-[7rem] text-center text-xs text-muted-foreground">
                          {row.label}
                        </span>
                        <div className="text-left">
                          <span
                            className={`text-sm font-medium ${
                              winner === "b"
                                ? "text-primary"
                                : winner === "a"
                                  ? "text-muted-foreground"
                                  : ""
                            }`}
                          >
                            {row.valueB}
                            {winner === "b" && <TrendingUp className="ml-1 inline size-3" />}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {/* AI Verdict */}
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">AI Verdict</h3>
              </div>

              {loading || verdictLoading ? (
                <VerdictSkeleton />
              ) : verdict ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-lg font-bold text-primary">{verdict.winner}</span>
                    <span className="text-xs text-muted-foreground">
                      is the better pick
                    </span>
                    <span
                      className={`mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        verdict.confidence === "High"
                          ? "bg-green-500/15 text-green-600"
                          : verdict.confidence === "Medium"
                            ? "bg-yellow-500/15 text-yellow-600"
                            : "bg-red-500/15 text-red-500"
                      }`}
                    >
                      {verdict.confidence} confidence
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed">{verdict.summary}</p>

                  <div className="space-y-3 text-sm">
                    <div>
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <TrendingUp className="size-3" /> Revenue
                      </div>
                      <p className="text-muted-foreground">{verdict.revenueAnalysis}</p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <TrendingDown className="size-3" /> Valuation
                      </div>
                      <p className="text-muted-foreground">{verdict.valuationAnalysis}</p>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        ⚠️ Risks
                      </div>
                      <p className="text-muted-foreground">{verdict.risks}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Could not load AI verdict.
                </p>
              )}
            </div>

            {/* Footer links */}
            {data && (
              <div className="flex items-center justify-center gap-4 pt-1">
                <Link
                  href={`/ticker/${data.stockA.symbol}`}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View {data.stockA.symbol} <ArrowRight className="size-3" />
                </Link>
                <Link
                  href={`/ticker/${data.stockB.symbol}`}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  View {data.stockB.symbol} <ArrowRight className="size-3" />
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
