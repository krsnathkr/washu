# Tick — Execution Plan

This plan turns the PRD into ordered, picked-off-one-at-a-time tasks. Phases run roughly in order; tasks within a phase are mostly independent so they can be parallelized across teammates.

**Convention:** Each task lists ① the file(s) it touches, ② the acceptance check that proves it's done.

---

## Phase A — Scaffold (foundation)

### A1. Bootstrap Next.js project
- **Do:** `npx create-next-app@latest tick --typescript --tailwind --app --eslint --src-dir=false --import-alias="@/*"`
- **Touches:** entire repo
- **Done when:** `npm run dev` opens the default Next page on `localhost:3000`.

### A2. Drop in the provided Tailwind v4 color scheme
- **Touches:** `app/globals.css`
- **Done when:** `<body>` background renders the off-white `--background`, primary green is reachable as `bg-primary` in a test element.

### A3. Install runtime deps
- **Do:** `npm install framer-motion yahoo-finance2 @google/generative-ai lightweight-charts lucide-react`
- **Done when:** `package.json` lists them; `npm run dev` still boots.

### A4. Init shadcn/ui
- **Do:** `npx shadcn@latest init` then `npx shadcn@latest add button card input toast sonner skeleton tabs`
- **Done when:** `components/ui/*.tsx` exist and import cleanly.

### A5. Env vars + .gitignore
- **Touches:** `.env.local`, `.gitignore`
- **Add keys:** `GEMINI_API_KEY=`, `NEWSAPI_KEY=`
- **Done when:** `.env.local` is gitignored and `process.env.GEMINI_API_KEY` is readable in a server route.

### A6. Define shared types
- **Touches:** `lib/types.ts`
- **Types:** `Ticker`, `StockSnapshot`, `ChartPoint`, `NewsItem`, `BullBear`, `SentimentSummary`, `SavedStockEntry`, `UserList`, `WatchlistEntry`
- **Done when:** types compile and are imported by at least one stub route.

---

## Phase B — Data layer (backend API routes)

### B1. Yahoo wrapper + stock route
- **Touches:** `lib/yahoo.ts`, `app/api/stock/[symbol]/route.ts`
- **Returns:** `{ symbol, name, price, change, changePct, pe, marketCap, week52High, week52Low, divYield, beta, volume, summary, chart: ChartPoint[] }`
- **Done when:** `curl localhost:3000/api/stock/AAPL` returns valid JSON with non-null `chart`.

### B2. In-memory TTL cache
- **Touches:** `lib/cache.ts`
- **API:** `getOrSet(key, ttlMs, () => Promise<T>)`
- **Done when:** wrapping B1 in this cache returns the same payload twice within 15 min without re-hitting Yahoo.

### B3. NewsAPI wrapper + news route
- **Touches:** `lib/newsapi.ts`, `app/api/news/[symbol]/route.ts`
- **Returns:** `NewsItem[]` of up to 5 articles
- **Cached:** 30 min via B2
- **Done when:** `curl /api/news/AAPL` returns 5 articles with title, source, url, publishedAt.

### B4. Gemini client + bull/bear route
- **Touches:** `lib/gemini.ts`, `app/api/gemini/bullbear/route.ts`
- **Input:** `{ symbol, name, stats, headlines }`
- **Returns:** `{ bull: string[], bear: string[], analyst: string }`
- **Cached:** 6 h via B2
- **Done when:** POSTing AAPL context returns 3 bull bullets, 3 bear bullets, and an analyst paragraph.

### B5. Reddit fetch + sentiment route
- **Touches:** `lib/reddit.ts`, `app/api/reddit/[symbol]/route.ts`
- **Reddit URL:** `https://www.reddit.com/r/stocks+wallstreetbets/search.json?q={symbol}&sort=new&limit=20&restrict_sr=1` (with `User-Agent: tick-hackathon/0.1`)
- **Pipes top 20 results into Gemini for the SentimentSummary**
- **Cached:** 1 h via B2
- **Done when:** `curl /api/reddit/AAPL` returns `{ label: "Bullish"|"Bearish"|"Mixed", points: string[] }`.

### B6. Gemini chat route
- **Touches:** `app/api/gemini/chat/route.ts`
- **Input:** `{ symbol, name, stats, question }`
- **Returns:** plain text answer (streaming optional)
- **Done when:** POSTing a question for AAPL returns a coherent answer in <4 s.

### B7. Ticker universe + next-ticker route
- **Touches:** `lib/tickerUniverse.ts`, `app/api/discover/next/route.ts`
- **Universe:** ~150 hard-coded US tickers (S&P 100 + popular retail names: TSLA NVDA GME AMC PLTR AMD MSFT GOOGL META AMZN NFLX BA DIS …)
- **Logic:** accept `?exclude=AAPL,MSFT`, return a random remaining one
- **Done when:** repeated calls with growing exclude list never repeat until the universe is exhausted.

---

## Phase C — Discovery UI (the core swipe loop)

### C1. Discovery page shell
- **Touches:** `app/page.tsx`, `app/layout.tsx`
- **Layout:** centered card container, fixed bottom slot reserved for `<ChatBar />`, top-right link to `/lists`
- **Done when:** an empty centered card renders against the theme background.

### C2. SwipeDeck component
- **Touches:** `components/SwipeDeck.tsx`
- **Behavior:** framer-motion `drag="x"`, threshold ±100px → fire `onSwipeLeft` / `onSwipeRight`, springs back if under threshold; left/right arrow keys also fire callbacks
- **Done when:** dragging a placeholder card past threshold dispatches the right callback and the card animates off-screen.

### C3. StockCard shell + data fetching hook
- **Touches:** `components/StockCard.tsx`, `lib/useStockCard.ts`
- **Hook:** fires the 4 parallel requests for a given symbol, exposes individual loading flags
- **Done when:** the card renders with header populated and skeleton shimmers on every other panel until data arrives.

### C4. ChartPanel
- **Touches:** `components/ChartPanel.tsx`
- **Lib:** `lightweight-charts` instance, dispose on unmount
- **Tabs:** 1D / 1W / 1M / 1Y → fetch a different range from `/api/stock`
- **Done when:** AAPL renders a green-themed line chart with working tabs.

### C5. StatsGrid
- **Touches:** `components/StatsGrid.tsx`
- **Renders:** 6 stats in a 3×2 grid (P/E, Mkt Cap, 52W H/L, Volume, Div Yield, Beta)
- **Done when:** values come from B1 and format with locale separators.

### C6. BullBearPanel
- **Touches:** `components/BullBearPanel.tsx`
- **Renders:** two columns (green ↑ / red ↓), bullets from B4, skeletons during load
- **Done when:** AAPL shows 3 bull and 3 bear bullets after first load.

### C7. SentimentPanel
- **Touches:** `components/SentimentPanel.tsx`
- **Renders:** label pill (Bullish / Bearish / Mixed) + 3 bullet takeaways from B5
- **Done when:** AAPL shows a label and bullets; "No sentiment" empty state on error.

### C8. NewsPanel
- **Touches:** `components/NewsPanel.tsx`
- **Renders:** 3–5 articles with source, title, relative time, external-link icon
- **Done when:** clicking a headline opens the article in a new tab.

### C9. ChatBar (Gemini Q&A)
- **Touches:** `components/ChatBar.tsx`
- **Layout:** fixed-bottom input pill; on submit opens an upward drawer with the conversation
- **Wires:** B6 with the current symbol + stats as context
- **Done when:** asking "what's the biggest risk?" while viewing AAPL returns a Gemini answer in the drawer.

### C10. Wire SwipeDeck → discovery loop
- **Touches:** `app/page.tsx`
- **Behavior:** on right-swipe → add to the built-in `Watchlist` + toast → fetch next; on left-swipe → fetch next; prefetch next ticker's data while current card is visible
- **Done when:** the demo loop in §17 of `prd.md` runs end-to-end.

### C11. Stock card list manager
- **Touches:** `components/StockCard.tsx`, `components/StockListMenu.tsx`, `components/ListEditorDialog.tsx`
- **Behavior:** add a 3-dot menu in the stock card header so users can add/remove the current stock across lists and create a new list inline
- **Done when:** a user can save one stock into multiple lists without leaving the card.

---

## Phase D — Lists + persistence

### D1. Generalized lists store
- **Touches:** `lib/lists.ts`, `lib/watchlist.ts`, `lib/types.ts`
- **API:** `useLists()` → `{ lists, createList, updateList, addToList, removeFromList, toggleInList, isInList, getListsForSymbol }`
- **Persistence:** `localStorage` under `tick:lists`
- **Migration:** old `tick:watchlist` entries migrate automatically into the built-in `Watchlist`
- **Done when:** lists survive a hard reload and legacy watchlist data is preserved.

### D2. Toast on swipe-right
- **Touches:** `app/page.tsx`
- **Lib:** `sonner`
- **Done when:** a right-swipe shows "Added AAPL to Watchlist" and supports undo.

### D3. Lists page
- **Touches:** `app/lists/page.tsx`, `components/WatchlistItem.tsx`
- **Renders:** all saved lists on one page, with `Watchlist` first, emoji badges, edit action, item counts, and stock cards per list
- **Done when:** every saved stock shows in the correct list and remove only affects that list.

### D4. `/watchlist` compatibility route
- **Touches:** `app/watchlist/page.tsx`
- **Behavior:** redirect legacy `/watchlist` visits to `/lists`
- **Done when:** existing links/bookmarks still land on the generalized lists page.

### D5. List creation and emoji editing
- **Touches:** `components/ListEditorDialog.tsx`, `app/lists/page.tsx`, `components/StockListMenu.tsx`
- **Behavior:** custom lists get a random emoji at creation time; users can edit emoji later, including the built-in `Watchlist`
- **Done when:** users can create and edit custom lists without touching code or storage manually.

---

## Phase E — Polish

### E1. Dark mode toggle
- **Touches:** `app/layout.tsx`, a small `ThemeToggle.tsx`
- **Behavior:** toggles `class="dark"` on `<html>`, persisted in localStorage
- **Done when:** every panel looks correct in both modes.

### E2. Empty / error states
- **Touches:** every panel component
- **Done when:** killing each upstream API one at a time still leaves the rest of the card usable.

### E3. Prefetch next ticker
- **Touches:** `app/page.tsx` / `lib/useStockCard.ts`
- **Done when:** swipe → next-card content visible in <200 ms.

### E4. Deploy to Vercel + demo rehearsal
- **Do:** `vercel`, set both env vars in dashboard
- **Done when:** the public URL runs the full demo script (PRD §15) without errors.

---

## Phase F — Stretch (only if time)


### F1. `/ticker/[symbol]` deep-link route
- Same card layout as discovery, no swipe controls; for sharing.


---

## Critical files reference
- `app/page.tsx`
- `app/lists/page.tsx`
- `app/watchlist/page.tsx`
- `app/api/stock/[symbol]/route.ts`
- `app/api/news/[symbol]/route.ts`
- `app/api/reddit/[symbol]/route.ts`
- `app/api/gemini/bullbear/route.ts`
- `app/api/gemini/chat/route.ts`
- `app/api/discover/next/route.ts`
- `components/StockCard.tsx`, `SwipeDeck.tsx`, `ChartPanel.tsx`, `ChatBar.tsx`, `StatsGrid.tsx`, `BullBearPanel.tsx`, `SentimentPanel.tsx`, `NewsPanel.tsx`, `WatchlistItem.tsx`, `StockListMenu.tsx`, `ListEditorDialog.tsx`
- `lib/yahoo.ts`, `gemini.ts`, `newsapi.ts`, `reddit.ts`, `tickerUniverse.ts`, `cache.ts`, `lists.ts`, `watchlist.ts`, `types.ts`
- `app/globals.css` (provided color scheme)

## Verification / demo script
1. `npm run dev` → land on `/`.
2. First card loads AAPL: chart renders, stats populate, bull/bear + news stream in.
3. Scroll inside the card to see all panels.
4. Type "what's the biggest risk here?" in the chat bar → Gemini replies inline.
5. Swipe right → toast "Added to Watchlist", next card (e.g. NVDA) appears in <200 ms.
6. Swipe left twice → cards cycle without duplicates.
7. Open the top-right `Lists` button → `Watchlist` appears first on `/lists`.
8. Create a custom list, confirm it gets a random emoji, then edit its emoji.
9. Use the stock-card 3-dot menu to add the same ticker to multiple lists.
10. Navigate to `/watchlist` → it redirects to `/lists`.
11. Toggle dark mode → theme switches cleanly.
12. Kill NewsAPI key → news panel shows empty state, rest of card still works.

## Current shipped additions
- Generalized saved-stocks experience centered on `/lists`
- Built-in default `Watchlist` retained as a special list
- Multi-list local persistence with automatic legacy watchlist migration
- Stock-card list menu for add/remove across lists
- Random emoji on custom-list creation plus emoji editing later
