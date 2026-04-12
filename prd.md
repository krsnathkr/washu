# Tick — Product Requirements Document

## 1. Overview
**Tick** is a minimal, Tinder-style web app for discovering stocks. Users swipe through stock cards, save interesting tickers to a watchlist, and ask Gemini follow-up questions inline. Tick does **not** execute trades — it is purely a discovery and research tool.

## 2. Problem
Retail investors, especially newcomers, find traditional stock research tools (Yahoo Finance, Bloomberg, Seeking Alpha) overwhelming. They want a fast, fun, mobile-friendly way to surface new tickers and get a digestible summary in one place.

## 3. Goals
- Make stock discovery feel playful and fast (Tinder-like).
- Surface everything a casual investor needs about a ticker on one scrollable card.
- Let users ask natural-language questions about the current ticker without leaving the page.
- Save promising tickers to a personal watchlist.

## 4. Non-goals (out of scope for hackathon)
- Real trading or brokerage integration
- User accounts / authentication / cross-device sync
- Price alerts or push notifications
- Portfolio P&L tracking (real or simulated)
- Options, crypto, forex
- Fundamental screening / advanced filters

## 5. Target user
Retail investors (especially first-timers) on web/mobile who want a low-effort way to discover and learn about US-listed stocks.

## 6. Core user stories
1. **Discover** — As a user, I see a stock I haven't seen before with chart, fundamentals, bull/bear case, sentiment, and news on one card.
2. **Swipe right** — As a user, I swipe right to add the current ticker to my watchlist.
3. **Swipe left** — As a user, I swipe left to skip and immediately see the next stock.
4. **Ask** — As a user, I type "what's this company's moat?" and get a Gemini answer in the context of the current ticker.
5. **Review** — As a user, I open the watchlist page and see every ticker I've saved.

## 7. Features

### MVP (P0 — must ship)
| ID | Feature | Source |
|---|---|---|
| F1 | Stock discovery card with swipe gestures (touch + keyboard arrows) | framer-motion |
| F2 | Interactive price chart with 1D / 1W / 1M / 1Y timeframes | lightweight-charts |
| F3 | Company summary + key technicals (P/E, market cap, 52W high/low, dividend yield, volume, beta) | yahoo-finance2 |
| F4 | Bull case / Bear case bullets | Gemini |
| F5 | Recent news (3–5 articles per ticker) | NewsAPI |
| F6 | Gemini chat bar at bottom of discovery page (ticker-scoped Q&A) | Gemini |
| F7 | Watchlist page (saved tickers) | localStorage |

### P1 — should ship if time
| ID | Feature | Source |
|---|---|---|
| F8 | Analyst view summary | Gemini |
| F9 | Reddit sentiment summary | Reddit JSON + Gemini |

### P2 — nice to have
| ID | Feature |
|---|---|
| F10 | Undo last swipe |
| F11 | Dark mode toggle |
| F12 | Swipe counter / streak |

## 8. Pages
1. **`/` — Discovery page**: a single centered card with the swipe deck, plus the Gemini chat bar pinned at the bottom of the viewport.
2. **`/watchlist` — Watchlist page**: grid/list of saved tickers with mini stats; clicking one opens the full card view.
3. **`/ticker/[symbol]` — (optional) Deep-link page**: same card layout as discovery, but no swipe controls — used for sharing.

## 9. Discovery card layout (top → bottom, scrollable inside card)
```
┌─────────────────────────────────────┐
│  AAPL   Apple Inc.       $xxx.xx ▲│   ← header: ticker, name, live price, day change %
│  ───────────────────────────────────│
│  [ Interactive price chart ]       │   ← 1D / 1W / 1M / 1Y tabs
│  ───────────────────────────────────│
│  Company summary (2–3 lines)       │
│  ───────────────────────────────────│
│  Key stats grid                    │   ← P/E, Mkt Cap, 52W H/L, Volume, Div Yield, Beta
│  ───────────────────────────────────│
│  Bull case (Gemini)                │
│  Bear case (Gemini)                │
│  ───────────────────────────────────│
│  Analyst view (Gemini)             │
│  ───────────────────────────────────│
│  Reddit sentiment summary          │
│  ───────────────────────────────────│
│  Recent news (3–5 headlines)       │
└─────────────────────────────────────┘
        ◀ swipe L          swipe R ▶

[ Ask anything about AAPL... ]   ← fixed Gemini chat bar
```

## 10. Non-functional requirements
- **Minimal UI** — heavy whitespace, single accent color (primary green from the provided theme), Outfit font.
- **Fast perceived load** — skeleton shimmers on every panel, optimistic swipe animation, prefetch the *next* ticker's data while the user reads the current card.
- **Mobile-first responsive** — swipe gestures with touch on mobile; left/right arrow keys + on-screen buttons on desktop.
- **Dark mode** — both light and dark CSS variables already provided in the theme; toggle persisted in localStorage.
- **Accessibility** — keyboard navigation, sufficient contrast (theme already meets it), screen-reader labels on swipe buttons.

## 11. Tech stack (locked)
| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind v4 (provided color scheme in `globals.css`) |
| UI primitives | shadcn/ui |
| Icons | lucide-react |
| Swipe gestures | framer-motion |
| Stock data | `yahoo-finance2` (npm) |
| Chart | `lightweight-charts` |
| News | NewsAPI |
| Reddit | Public Reddit `.json` endpoints (no OAuth) |
| LLM | Google Gemini API (`@google/generative-ai`) |
| State / persistence | localStorage + React Context |
| Deploy | Vercel |

### Required env vars
```
GEMINI_API_KEY=
NEWSAPI_KEY=
```

## 12. Architecture
```
app/
├── page.tsx                          → Discovery page (swipe loop)
├── watchlist/page.tsx                → Saved tickers
├── ticker/[symbol]/page.tsx          → (optional) deep-link card view
└── api/
    ├── stock/[symbol]/route.ts       → yahoo-finance2 quote + summary + chart
    ├── news/[symbol]/route.ts        → NewsAPI proxy + cache
    ├── reddit/[symbol]/route.ts      → Reddit JSON fetch + Gemini sentiment
    ├── gemini/bullbear/route.ts      → Gemini bull/bear + analyst view
    ├── gemini/chat/route.ts          → Gemini ticker-scoped Q&A (streaming)
    └── discover/next/route.ts        → Next ticker (random, exclude swiped)

components/
├── StockCard.tsx
├── SwipeDeck.tsx                     → framer-motion swipe physics
├── ChartPanel.tsx
├── StatsGrid.tsx
├── BullBearPanel.tsx
├── NewsPanel.tsx
├── SentimentPanel.tsx
├── ChatBar.tsx                       → Fixed bottom Gemini chat
└── WatchlistItem.tsx

lib/
├── yahoo.ts                          → yahoo-finance2 wrapper
├── gemini.ts                         → Gemini client + prompts
├── newsapi.ts
├── reddit.ts
├── tickerUniverse.ts                 → ~150 curated US tickers + next-ticker logic
├── cache.ts                          → in-memory TTL cache (server)
├── watchlist.ts                      → localStorage CRUD + React Context
└── types.ts
```

### Data flow for one card
1. Frontend calls `/api/discover/next?exclude=…` → gets next symbol.
2. Frontend fires parallel requests: `/api/stock/AAPL`, `/api/news/AAPL`, `/api/gemini/bullbear?symbol=AAPL`, `/api/reddit/AAPL`.
3. Card renders progressively — header + chart + stats first, then bull/bear, sentiment, news as each promise resolves.
4. Background prefetch of the *next* ticker begins as soon as the current card is visible.

### Caching (mandatory because of free-tier limits)
| Data | TTL | Reason |
|---|---|---|
| Stock fundamentals | 15 min | yahoo-finance2 has no hard limit, but we still cache |
| News | 30 min | NewsAPI free tier = 100 req/day |
| Bull/bear + analyst view | 6 h | Expensive Gemini call, content changes slowly |
| Reddit sentiment | 1 h | Sentiment shifts hourly, not by minute |

## 13. Gemini prompt sketches

**Bull / bear case** (single call, JSON output)
```
You are a neutral equity analyst. For ticker {symbol} ({companyName}),
produce a concise bull case and bear case grounded in recent fundamentals.
Return JSON: { "bull": ["…","…","…"], "bear": ["…","…","…"] }.
Each bullet ≤ 20 words. Do not give investment advice.
Context: {price}, P/E {pe}, recent headlines: {headlines}.
```

**Analyst view**
```
Summarize the current Wall Street analyst consensus for {symbol} in 2–3 sentences.
Mention average rating (buy/hold/sell) and price-target range if known.
Plain text only.
```

**Reddit sentiment**
```
Here are 20 recent Reddit posts/comments about {symbol}: {payload}
Classify overall sentiment (Bullish / Bearish / Mixed) and give 3 bullet
takeaways of what retail investors are discussing.
Return JSON: { "label": "...", "points": ["…","…","…"] }.
```

**Chat bar (ticker-scoped Q&A)**
```
System: You are Tick, a helpful stock research assistant. The user is
viewing {symbol} ({companyName}). Current stats: {stats}.
User: {question}
Answer concisely (≤120 words). Avoid disclaimers unless asked.
```

## 14. Color & typography
The user-provided Tailwind v4 theme (light + dark) is the source of truth. Primary accent is green (`oklch(0.5568 0.1355 155.8120)`). Font is **Outfit** (sans). All components must use the CSS custom properties (`var(--background)`, `var(--primary)`, etc.) — no hard-coded colors.

## 15. Success metrics (for demo)
- Cold-load discovery page → first card interactive in **< 3 s**
- Swipe → next card visible in **< 200 ms** (because of prefetch)
- Gemini chat reply in **< 4 s** for typical questions
- Watchlist persists across page reloads
- Zero unhandled errors during a 2-minute demo loop

## 16. Risks & mitigations
| Risk | Mitigation |
|---|---|
| NewsAPI 100 req/day cap is hit during demo | Aggressive 30-min cache; manual fallback list of 5 cached tickers |
| Gemini rate-limited mid-demo | 6 h cache on bull/bear; pre-warm cache for the first ~10 tickers before demoing |
| Reddit blocks scraping from a Vercel IP | Set a User-Agent header; fallback to "No sentiment available" empty state |
| yahoo-finance2 returns stale/empty data | Show skeleton + error state; retry once with backoff |