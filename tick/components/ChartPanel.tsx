import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, LineSeries } from "lightweight-charts";
import { ChartPoint } from "@/lib/types";

type RangeTab = "1W" | "1M" | "1Y";

export function ChartPanel({ symbol, initialChart }: { symbol: string, initialChart: ChartPoint[] | null }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const latestRequestRef = useRef(0);

  const [activeRange, setActiveRange] = useState<RangeTab>("1M");
  const [chartData, setChartData] = useState<ChartPoint[] | null>(initialChart);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If symbol changes, reset
    setActiveRange("1M");
    setChartData(initialChart);
  }, [symbol, initialChart]);

  useEffect(() => {
    if (!symbol) return;

    if (activeRange === "1M" && initialChart) {
      setChartData(initialChart);
      setLoading(false);
      return;
    }

    const requestId = ++latestRequestRef.current;
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/stock/${symbol}?range=${activeRange}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load ${activeRange} chart for ${symbol}`);
        }
        return res.json();
      })
      .then((data) => {
        if (requestId !== latestRequestRef.current) return;
        setChartData(data.chart ?? null);
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
  }, [symbol, activeRange, initialChart]);

  useEffect(() => {
    if (!chartContainerRef.current || !chartData) return;

    // Get styles from CSS vars roughly
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--chart-1').replace('oklch(', '').replace(')', '').split(' ').join(', ');
    // Lightweight charts prefers rgb/hex, oklch fallback might be tricky but we can just use a standard green if unable to parse.
    // Actually tailwind oklch variables aren't directly parsed by lightweight-charts.
    // Let's rely on a solid hex or rgb
    const lineColor = "#22c55e"; // A standard green fallback

    const chart = createChart(chartContainerRef.current, {
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

    chartInstanceRef.current = chart;

    const lineSeries = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      crosshairMarkerVisible: true,
    });
    lineSeriesRef.current = lineSeries;

    // Type casting because lightweight charts handles string dates well, but its exact type depends:
    lineSeries.setData(chartData.map(d => ({ 
      time: d.time as any, 
      value: d.value 
    })));

    chart.timeScale().fitContent();

    // Make chart responsive
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [chartData]); // Re-render chart on data change

  const ranges: RangeTab[] = ["1W", "1M", "1Y"];

  return (
    <div className="flex flex-col gap-2 pt-2 pb-4">
      {/* Chart Canvas */}
      <div className="h-48 w-full relative" ref={chartContainerRef}>
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
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mt-2">
        {ranges.map((range) => (
          <button
            key={range}
            onClick={() => setActiveRange(range)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
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
}
