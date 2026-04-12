# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm start        # Serve production build
npm run lint     # ESLint
```

There are no tests. No test runner is configured.

## Architecture

**Tick** is a Tinder-style stock discovery app. Users swipe through stock cards, each loaded with real-time data, AI-generated analysis, Reddit sentiment, and a chat interface.

### Request flow

1. User lands on `/` → `SwipeDeck` renders a queue of `StockCard` components
2. Each card uses `lib/useStockCard.ts` to fire parallel fetches for stock data, news, bull/bear bullets, and Reddit sentiment
3. All fetches hit Next.js API routes, which wrap external APIs (Yahoo Finance, NewsAPI, Gemini, Reddit) behind an in-memory TTL cache (`lib/cache.ts`)
4. A fixed `ChatBar` at the bottom opens a drawer for ticker-scoped Q&A via `/api/gemini/chat`

### API routes (`app/api/`)

| Route | Cache TTL | External source |
|---|---|---|
| `stock/[symbol]` | 15 min | yahoo-finance2 |
| `news/[symbol]` | 30 min | NewsAPI (100 req/day — cache is critical) |
| `reddit/[symbol]` | 1 h | Reddit JSON → Gemini |
| `gemini/bullbear` | 6 h | Gemini (expensive call) |
| `gemini/chat` | none | Gemini (per-question) |
| `discover/next` | none | Static ticker universe (~500 tickers) |

### Key files

- `lib/types.ts` — All shared TypeScript interfaces (`StockSnapshot`, `BullBear`, `SentimentSummary`, etc.)
- `lib/useStockCard.ts` — Central hook: orchestrates parallel data fetching for a card, exposes per-section loading flags
- `lib/cache.ts` — `getOrSet(key, ttlMs, fetcher)` used in every API route
- `lib/tickerUniverse.ts` — Hard-coded ~500 tickers; randomizes next pick, supports `exclude` list
- `lib/watchlist.ts` — `WatchlistContext` backed by localStorage

### Caching architecture

Two layers of caching exist:
1. **Server-side** (`lib/cache.ts`): in-memory TTL per API route — survives across requests within the same server process
2. **Client-side** (`useStockCard.ts`): cards already rendered are not re-fetched on revisit

### Environment variables

```
GEMINI_API_KEY=   # Required for /api/gemini/* routes
NEWSAPI_KEY=      # Required for /api/news/* route
```

Set these in `.env.local` (gitignored).

### Styling

Tailwind v4 with CSS custom properties in `app/globals.css`. Colors use the OKLch color space. Primary accent is green `oklch(0.5568 0.1355 155.8120)`. Font is Outfit (300–700 weights). Dark mode is toggled by adding `class="dark"` to `<html>` and persisted in localStorage.
