/* ────────────────────────────────────────────────────
   Tick – Shared TypeScript types
   ──────────────────────────────────────────────────── */

/** A ticker symbol string, e.g. "AAPL" */
export type Ticker = string;

/** A single data point on the price chart */
export interface ChartPoint {
  /** Unix timestamp (seconds) or date string */
  time: number | string;
  /** Price at this point in time */
  value: number;
}

/** Snapshot of a stock's current data returned by /api/stock/[symbol] */
export interface StockSnapshot {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  pe: number | null;
  marketCap: number | null;
  week52High: number | null;
  week52Low: number | null;
  divYield: number | null;
  beta: number | null;
  volume: number | null;
  summary: string;
  chart: ChartPoint[];
}

/** A news article from NewsAPI */
export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  /** Optional thumbnail URL */
  imageUrl?: string;
}

/** Bull / bear analysis from Gemini */
export interface BullBear {
  bull: string[];
  bear: string[];
  analyst: string;
}

/** Reddit sentiment summary from Gemini */
export interface SentimentSummary {
  label: "Bullish" | "Bearish" | "Mixed";
  points: string[];
}

/** A saved stock entry stored inside a user list */
export interface SavedStockEntry {
  symbol: string;
  name: string;
  addedAt: number; // Unix timestamp (ms)
}

/** A user-defined list of saved stocks */
export interface UserList {
  id: string;
  name: string;
  emoji: string;
  createdAt: number;
  updatedAt: number;
  entries: SavedStockEntry[];
}

/** Backwards-compatible alias for the original single-list model */
export type WatchlistEntry = SavedStockEntry;

/* ────────────────────────────────────────────────────
   Stock comparison types
   ──────────────────────────────────────────────────── */

/** Extended financial data used in side-by-side comparisons */
export interface CompareFinancials {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  pe: number | null;
  marketCap: number | null;
  revenueGrowth: number | null;
  earningsGrowth: number | null;
  profitMargin: number | null;
  debtToEquity: number | null;
  week52High: number | null;
  week52Low: number | null;
  divYield: number | null;
  beta: number | null;
}

/** Pair of stocks returned by /api/compare */
export interface CompareData {
  stockA: CompareFinancials;
  stockB: CompareFinancials;
}

/** AI comparison verdict returned by /api/gemini/compare */
export interface CompareVerdict {
  winner: string;
  confidence: "High" | "Medium" | "Low";
  summary: string;
  revenueAnalysis: string;
  valuationAnalysis: string;
  risks: string;
}
