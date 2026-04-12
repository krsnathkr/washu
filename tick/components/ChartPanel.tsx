import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  createChart,
  LineSeries,
  UTCTimestamp,
} from "lightweight-charts";
import { ChartPoint } from "@/lib/types";

type RangeTab = "1D" | "1W" | "1M" | "1Y";
type ChartMode = "line" | "candlestick";
type RemoteRange = Exclude<RangeTab, "1M">;
type RemoteCharts = Partial<Record<RemoteRange, ChartPoint[] | null>>;

function hasCandlestickValues(point: ChartPoint): point is ChartPoint & {
  open: number;
  high: number;
  low: number;
  close: number;
} {
  return (
    typeof point.open === "number" &&
    typeof point.high === "number" &&
    typeof point.low === "number" &&
    typeof point.close === "number"
  );
}

export const ChartPanel = memo(function ChartPanel({ symbol, initialChart }: { symbol: string, initialChart: ChartPoint[] | null }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const latestRequestRef = useRef(0);

  const [activeRange, setActiveRange] = useState<RangeTab>("1M");
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [remoteCharts, setRemoteCharts] = useState<RemoteCharts>({});
  const [loading, setLoading] = useState(false);

  const chartData =
    activeRange === "1M" ? initialChart : (remoteCharts[activeRange] ?? null);
  const hasChartData = Boolean(chartData?.length);
  const isEmptyChart = chartData !== null && chartData.length === 0;

  const candlestickData = useMemo(
    () => chartData?.filter(hasCandlestickValues) ?? [],
    [chartData]
  );
  const hasCandlestickData = candlestickData.length > 0;
  const effectiveChartMode = chartMode === "candlestick" && hasCandlestickData ? "candlestick" : "line";

  useEffect(() => {
    if (!symbol || activeRange === "1M" || remoteCharts[activeRange] !== undefined) {
      return;
    }

    const requestId = ++latestRequestRef.current;
    const controller = new AbortController();

    fetch(`/api/stock/${symbol}?range=${activeRange}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load ${activeRange} chart for ${symbol}`);
        }
        return res.json();
      })
      .then((data) => {
        if (requestId !== latestRequestRef.current) return;
        setRemoteCharts((prev) => ({
          ...prev,
          [activeRange]: data.chart ?? null,
        }));
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error(err);
        if (requestId === latestRequestRef.current) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [activeRange, remoteCharts, symbol]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !hasChartData) return;
    const currentChartData = chartData ?? [];

    const lineColor = "#22c55e";

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { color: "transparent" },
        textColor: "#a1a1aa", // neutral-400
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(100, 100, 100, 0.1)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      handleScroll: false,
      handleScale: false,
    });

    if (effectiveChartMode === "candlestick") {
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
        borderVisible: false,
      });

      candlestickSeries.setData(
        candlestickData.map((point) => ({
          time: point.time as UTCTimestamp,
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
        }))
      );
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: lineColor,
        lineWidth: 2,
        crosshairMarkerVisible: true,
      });

      lineSeries.setData(
        currentChartData.map((point) => ({
          time: point.time as UTCTimestamp,
          value: point.value,
        }))
      );
    }

    chart.timeScale().fitContent();

    const syncChartSize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      chart.resize(Math.floor(width), Math.floor(height));
    };

    syncChartSize();

    let resizeFrame = requestAnimationFrame(() => {
      syncChartSize();
    });

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(() => {
              syncChartSize();
            });
          })
        : null;

    resizeObserver?.observe(container);
    window.addEventListener("resize", syncChartSize);

    return () => {
      cancelAnimationFrame(resizeFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", syncChartSize);
      chart.remove();
    };
  }, [candlestickData, chartData, effectiveChartMode, hasChartData]); // Re-render chart on data or mode change

  const ranges: RangeTab[] = ["1D", "1W", "1M", "1Y"];
  const modes: Array<{ label: string; value: ChartMode; disabled?: boolean }> = [
    { label: "Line", value: "line" },
    { label: "Candles", value: "candlestick", disabled: !hasCandlestickData },
  ];

  return (
    <div className="flex flex-col gap-3 px-4 pt-2 pb-5 sm:px-5 sm:pb-4">
      {/* Chart Canvas */}
      <div className="relative h-40 w-full sm:h-48" ref={chartContainerRef}>
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 p-1.5 backdrop-blur-sm">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => !mode.disabled && setChartMode(mode.value)}
              disabled={mode.disabled}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition-all ${
                effectiveChartMode === mode.value
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              } ${mode.disabled ? "cursor-not-allowed opacity-50 hover:bg-transparent" : ""}`}
              title={mode.disabled ? "Candlestick data isn't available for this chart." : undefined}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider animate-pulse">Loading...</span>
          </div>
        )}
        {(!chartData && !loading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-full bg-muted animate-pulse rounded" />
          </div>
        )}
        {(isEmptyChart && !loading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              No chart data for {activeRange}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-1 flex flex-wrap justify-center gap-2.5">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => {
              setActiveRange(range);
              setLoading(range === "1M" ? false : remoteCharts[range] === undefined);
            }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeRange === range
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
});
