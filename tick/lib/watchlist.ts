import { useState, useEffect } from "react";
import { WatchlistEntry } from "./types";

export function useWatchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tick:watchlist");
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load watchlist", e);
    }
  }, []);

  const save = (newEntries: WatchlistEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem("tick:watchlist", JSON.stringify(newEntries));
    // Dispatch a custom event so other components can sync
    window.dispatchEvent(new Event("tick:watchlist:updated"));
  };

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem("tick:watchlist");
        if (stored) {
          setEntries(JSON.parse(stored));
        }
      } catch (e) {}
    };
    window.addEventListener("tick:watchlist:updated", handleUpdate);
    return () => window.removeEventListener("tick:watchlist:updated", handleUpdate);
  }, []);

  const add = (symbol: string, name: string = symbol) => {
    if (entries.some((e) => e.symbol === symbol)) return;
    const newEntry: WatchlistEntry = { symbol, name, addedAt: Date.now() };
    save([...entries, newEntry]);
  };

  const remove = (symbol: string) => {
    save(entries.filter((e) => e.symbol !== symbol));
  };

  const has = (symbol: string) => {
    return entries.some((e) => e.symbol === symbol);
  };

  return { entries, add, remove, has };
}
