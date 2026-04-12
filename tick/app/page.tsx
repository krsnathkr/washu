"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { StockCard } from "@/components/StockCard";
import { SwipeDeck } from "@/components/SwipeDeck";
import { ChatBar } from "@/components/ChatBar";
import { useStockCard } from "@/lib/useStockCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { ListPlus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useLists, WATCHLIST_ID } from "@/lib/lists";

type SwipeHistoryEntry = {
  symbol: string;
  previousSymbols: string[];
  addedToWatchlist: boolean;
};

export default function Home() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryEntry[]>([]);
  const listsStore = useLists();
  const swipeHistoryRef = useRef<SwipeHistoryEntry[]>([]);
  const nextSymbolRequestRef = useRef(0);

  const activeSymbol = symbols[0];
  const nextSymbol = symbols[1];
  const canUndo = swipeHistory.length > 0;

  const { stock: activeStock } = useStockCard(activeSymbol || null);
  // Warm the symbol-scoped cache for the next card without touching the active card's data.
  useStockCard(nextSymbol || null);

  // Refs to keep callbacks stable (read latest values without re-creating closures)
  const symbolsRef = useRef(symbols);
  symbolsRef.current = symbols;
  const listsStoreRef = useRef(listsStore);
  listsStoreRef.current = listsStore;
  const activeStockRef = useRef(activeStock);
  activeStockRef.current = activeStock;

  // Fetch the first 2 symbols to start the loop
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const res1 = await fetch("/api/discover/next");
        const data1 = await res1.json();

        const res2 = await fetch(`/api/discover/next?exclude=${data1.symbol}`);
        const data2 = await res2.json();

        if (isMounted) {
          setSymbols([data1.symbol, data2.symbol]);
          setLoadingInitial(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoadingInitial(false);
      }
    };
    init();
    return () => { isMounted = false; };
  }, []);

  const undoLastSwipe = useCallback((showToast = true) => {
    const lastSwipe = swipeHistoryRef.current.at(-1);
    if (!lastSwipe) {
      if (showToast) {
        toast("Nothing to undo yet");
      }
      return;
    }

    nextSymbolRequestRef.current += 1;
    swipeHistoryRef.current = swipeHistoryRef.current.slice(0, -1);
    setSwipeHistory(swipeHistoryRef.current);
    setSymbols(lastSwipe.previousSymbols);

    if (lastSwipe.addedToWatchlist) {
      listsStoreRef.current.removeFromList(WATCHLIST_ID, lastSwipe.symbol);
    }

    if (showToast) {
      toast.success(`Restored ${lastSwipe.symbol}`);
    }
  }, []);

  const handleSwipe = useCallback(async (dir: "left" | "right") => {
    const currentSymbol = symbolsRef.current[0];
    if (!currentSymbol) return;

    const previousSymbols = [...symbolsRef.current];
    let addedToWatchlist = false;

    if (dir === "right") {
      addedToWatchlist = listsStoreRef.current.addToList(
        WATCHLIST_ID,
        currentSymbol,
        activeStockRef.current?.data?.name || currentSymbol
      );

      if (addedToWatchlist) {
        toast.success(`Added ${currentSymbol} to Watchlist`, {
          action: {
            label: "Undo",
            onClick: () => undoLastSwipe(false),
          },
        });
      } else {
        toast(`${currentSymbol} is already in Watchlist`, {
          action: {
            label: "Undo swipe",
            onClick: () => undoLastSwipe(false),
          },
        });
      }
    } else {
      toast(`Skipped ${currentSymbol}`, {
        action: {
          label: "Undo",
          onClick: () => undoLastSwipe(false),
        },
      });
    }

    const nextHistory = [
      ...swipeHistoryRef.current,
      {
        symbol: currentSymbol,
        previousSymbols,
        addedToWatchlist,
      },
    ];
    swipeHistoryRef.current = nextHistory;
    setSwipeHistory(nextHistory);

    const requestId = ++nextSymbolRequestRef.current;
    const excludeList = previousSymbols.join(",");

    setSymbols(prev => prev.slice(1));

    // Fetch the new "next" symbol
    fetch(`/api/discover/next?exclude=${excludeList}`)
      .then(r => r.json())
      .then(d => {
        if (requestId === nextSymbolRequestRef.current && d.symbol) {
          setSymbols(prev => [...prev, d.symbol]);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch next symbol", error);
      });
  }, [undoLastSwipe]);

  const handleSwipeLeft = useCallback(() => handleSwipe("left"), [handleSwipe]);
  const handleSwipeRight = useCallback(() => handleSwipe("right"), [handleSwipe]);

  if (loadingInitial) {
    return (
      <main className="flex-1 flex items-center justify-center bg-background relative overflow-hidden">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center flex-grow bg-background relative overflow-hidden h-screen">
      
      <div className="absolute top-4 right-4 z-10 w-full flex justify-end px-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <ThemeToggle />
          <Link href="/lists" className="bg-card text-foreground p-2 rounded-full shadow-md border border-border/50 hover:bg-muted transition-colors flex items-center gap-2">
             <ListPlus className="w-5 h-5" />
             <span className="text-sm font-semibold pr-2">Lists</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center p-4 pt-16 pb-28 sm:pb-32 relative overflow-hidden absolute inset-0">
         {/* Thin grid background */}
         <div
           aria-hidden="true"
           className="pointer-events-none absolute inset-0"
           style={{
             backgroundImage:
               `repeating-linear-gradient(0deg, var(--border) 0 0.5px, transparent 0.5px 100%),
                repeating-linear-gradient(90deg, var(--border) 0 0.5px, transparent 0.5px 100%)`,
             backgroundSize: '48px 48px',
             opacity: 0.3,
           }}
         />
         <AnimatePresence>
            {activeSymbol && (
              <SwipeDeck
                key={activeSymbol}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onUndo={undoLastSwipe}
                undoDisabled={!canUndo}
              >
                <StockCard symbol={activeSymbol} />
              </SwipeDeck>
            )}
         </AnimatePresence>
      </div>

      {activeSymbol && <ChatBar symbol={activeSymbol} stats={activeStock?.data} />}
      
    </main>
  );
}
