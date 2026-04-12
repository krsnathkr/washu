"use client";

import { useEffect, useState } from "react";
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

export default function Home() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const listsStore = useLists();

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

  const activeSymbol = symbols[0];
  const nextSymbol = symbols[1];

  const undoSwipe = (symbol: string) => {
    setSymbols(prev => [symbol, ...prev.slice(0, -1)]);
  };

  const handleSwipe = async (dir: "left" | "right") => {
    if (!activeSymbol) return;

    const currentSymbol = activeSymbol;

    if (dir === "right") {
      const added = listsStore.addToList(
        WATCHLIST_ID,
        currentSymbol,
        activeStock?.data?.name || currentSymbol
      );

      if (added) {
        toast.success(`Added ${currentSymbol} to Watchlist`, {
          action: {
            label: "Undo",
            onClick: () => {
              listsStore.removeFromList(WATCHLIST_ID, currentSymbol);
              undoSwipe(currentSymbol);
            },
          },
        });
      } else {
        toast(`${currentSymbol} is already in Watchlist`, {
          action: {
            label: "Undo swipe",
            onClick: () => undoSwipe(currentSymbol),
          },
        });
      }
    } else {
      toast(`Skipped ${currentSymbol}`, {
        action: {
          label: "Undo",
          onClick: () => undoSwipe(currentSymbol),
        },
      });
    }

    // Shift symbols
    const exList = symbols.join(",");
    setSymbols(prev => prev.slice(1));

    // Fetch the new "next" symbol
    fetch(`/api/discover/next?exclude=${exList}`)
      .then(r => r.json())
      .then(d => {
        if (d.symbol) {
          setSymbols(prev => [...prev, d.symbol]);
        }
      });
  };

  const { stock: activeStock } = useStockCard(activeSymbol || null);
  // Warm the symbol-scoped cache for the next card without touching the active card's data.
  useStockCard(nextSymbol || null);

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

      <div className="flex-1 w-full flex items-center justify-center p-4 pt-16 pb-24 relative overflow-hidden absolute inset-0">
         <AnimatePresence>
            {activeSymbol && (
              <SwipeDeck
                key={activeSymbol}
                onSwipeLeft={() => handleSwipe("left")}
                onSwipeRight={() => handleSwipe("right")}
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
