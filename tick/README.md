<![CDATA[<div align="center">

# 📈 Tick

**Swipe. Discover. Invest smarter.**

A Tinder-style stock discovery app that turns market research into a fast, fun experience.

**[🔗 Live Demo](https://tick-wine.vercel.app/)**

[Getting Started](#-getting-started) · [Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack)

</div>

---

## 🎯 What is Tick?

Tick reimagines stock research for the modern retail investor. Instead of drowning in Bloomberg terminals and dense financial pages, users **swipe through beautifully designed stock cards** — each packed with real-time data, AI-generated analysis, and community sentiment — all on a single scrollable surface.

**Swipe right** to save a stock. **Swipe left** to skip. **Ask Gemini** anything about the current ticker without ever leaving the page.

> Tick is a discovery and research tool — it does not execute trades.

> **⚠️ Note:** The [live demo](https://tick-wine.vercel.app/) has the Gemini API key removed, so AI-powered features — bull/bear case analysis, Reddit sentiment summary, analyst view, and the Gemini chat bar — will not return results. All other features (charts, stats, news, lists, swipe gestures) work as expected. To experience the full app, clone the repo and add your own API keys.

---

## ✨ Features

### Core Experience
- **🃏 Swipe-to-Discover** — Tinder-style card interface with physics-based drag gestures (touch + keyboard arrow keys)
- **📊 Interactive Charts** — Real-time price charts with 1D / 1W / 1M / 1Y timeframe tabs powered by Lightweight Charts
- **📈 Key Stats at a Glance** — P/E ratio, market cap, 52-week high/low, volume, dividend yield, and beta in a clean grid
- **🤖 AI Bull & Bear Cases** — Gemini-generated bull and bear arguments grounded in live fundamentals
- **📰 Breaking News** — 3–5 latest headlines per ticker from NewsAPI
- **💬 Reddit Sentiment** — Aggregated retail investor sentiment from r/stocks and r/wallstreetbets, analyzed by Gemini
- **🧠 Gemini Chat** — Ask any follow-up question about the current stock in a fixed bottom chat bar

### Organization
- **📋 Smart Lists** — Built-in Watchlist + unlimited custom lists, all persisted in localStorage
- **🔖 Multi-list Support** — Save the same stock to multiple lists via a 3-dot menu on each card
- **🎨 Emoji Badges** — Custom lists get a random emoji at creation; editable anytime
- **🔄 Legacy Migration** — Existing watchlist data automatically migrates to the new lists system

### Polish
- **🌗 Dark Mode** — Full light/dark theme toggle, persisted across sessions
- **⚡ Prefetch Pipeline** — Next card's data loads in the background while you read the current one (~200 ms transitions)
- **🛡️ Resilient Error States** — Individual API failures degrade gracefully; the rest of the card stays functional
- **📱 Mobile-First** — Touch swipe on mobile, keyboard + buttons on desktop

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A **[Google Gemini API key](https://aistudio.google.com/apikey)**
- A **[NewsAPI key](https://newsapi.org/register)** (free tier works)

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/tick.git
cd tick

# Install dependencies
npm install

# Create your environment file
cp .env.local.example .env.local
```

Add your API keys to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_key_here
NEWSAPI_KEY=your_newsapi_key_here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the first stock card loads automatically.

### Deploy

```bash
# Deploy to Vercel
vercel

# Set environment variables in the Vercel dashboard:
#   GEMINI_API_KEY
#   NEWSAPI_KEY
```

---

## 🏗️ Architecture

```
app/
├── page.tsx                          → Discovery page (swipe loop)
├── lists/page.tsx                    → Watchlist + custom lists
├── watchlist/page.tsx                → Redirects to /lists (legacy compat)
├── ticker/[symbol]/page.tsx          → Deep-link card view
└── api/
    ├── stock/[symbol]/route.ts       → Yahoo Finance quote + chart data
    ├── news/[symbol]/route.ts        → NewsAPI proxy (cached)
    ├── reddit/[symbol]/route.ts      → Reddit sentiment via Gemini
    ├── gemini/bullbear/route.ts      → AI bull/bear + analyst view
    ├── gemini/chat/route.ts          → Ticker-scoped Q&A
    ├── compare/route.ts              → Side-by-side stock comparison
    └── discover/next/route.ts        → Random next ticker from universe

components/
├── SwipeDeck.tsx                     → Framer Motion swipe physics
├── StockCard.tsx                     → Main card shell
├── ChartPanel.tsx                    → Lightweight Charts integration
├── StatsGrid.tsx                     → Key financials grid
├── BullBearPanel.tsx                 → AI-generated arguments
├── SentimentPanel.tsx                → Reddit sentiment display
├── NewsPanel.tsx                     → Recent headlines
├── ChatBar.tsx                       → Fixed-bottom Gemini chat
├── StockListMenu.tsx                 → 3-dot list management menu
├── ListEditorDialog.tsx              → Create/edit list modal
├── CompareOverlay.tsx                → Side-by-side comparison view
├── DraggableWatchlistItem.tsx        → Drag-to-compare on lists page
└── ThemeToggle.tsx                   → Dark mode switch

lib/
├── yahoo.ts                          → yahoo-finance2 wrapper
├── gemini.ts                         → Gemini client + prompt templates
├── newsapi.ts                        → NewsAPI client
├── reddit.ts                         → Reddit JSON fetcher
├── cache.ts                          → In-memory TTL cache (server-side)
├── lists.ts                          → Generalized localStorage store
├── watchlist.ts                      → Compatibility wrapper
├── tickerUniverse.ts                 → ~150 curated US tickers
├── useStockCard.ts                   → Parallel data-fetching hook
├── useCompare.ts                     → Cross-stock comparison hook
└── types.ts                          → Shared TypeScript types
```

### Data Flow

```
User lands on /
       │
       ▼
GET /api/discover/next?exclude=...  →  random ticker
       │
       ▼
  4 parallel requests fire:
  ├── /api/stock/AAPL        (yahoo-finance2 → quote + chart)
  ├── /api/news/AAPL         (NewsAPI → headlines)
  ├── /api/gemini/bullbear   (Gemini → bull/bear bullets)
  └── /api/reddit/AAPL       (Reddit → Gemini sentiment)
       │
       ▼
  Card renders progressively (skeleton → data)
  Background prefetch of NEXT ticker begins
       │
       ▼
  Swipe right → save to Watchlist + toast + next card
  Swipe left  → skip + next card
```

### Caching Strategy

All external API calls are cached server-side to respect free-tier rate limits:

| Data Source | TTL | Reason |
|---|---|---|
| Stock fundamentals | 15 min | Balances freshness with API load |
| News articles | 30 min | NewsAPI free tier = 100 req/day |
| Bull/bear analysis | 6 hours | Expensive Gemini call; content evolves slowly |
| Reddit sentiment | 1 hour | Sentiment shifts hourly, not by the minute |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) + TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) with custom OKLCH color theme |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) |
| **Charts** | [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) |
| **Stock Data** | [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2) |
| **News** | [NewsAPI](https://newsapi.org/) |
| **AI/LLM** | [Google Gemini](https://ai.google.dev/) (`@google/generative-ai`) |
| **Toasts** | [Sonner](https://sonner.emilkowal.dev/) |
| **Theme** | [next-themes](https://github.com/pacocoursey/next-themes) |
| **Persistence** | localStorage (browser-local, no accounts) |
| **Deploy** | [Vercel](https://vercel.com/) |

---

## 📱 Pages

| Route | Description |
|---|---|
| `/` | Discovery page — swipe through stock cards |
| `/lists` | All saved lists with Watchlist first, custom lists below |
| `/watchlist` | Legacy redirect → `/lists` |
| `/ticker/[symbol]` | Deep-link view for sharing a specific stock |

---

## ⚙️ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI features |
| `NEWSAPI_KEY` | ✅ | NewsAPI key for recent headlines |

---

## 📝 License

This project was built for the WashU hackathon.
]]>
