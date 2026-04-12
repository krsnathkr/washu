"use client";

import { useWatchlist } from "@/lib/watchlist";
import { WatchlistItem } from "@/components/WatchlistItem";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WatchlistPage() {
  const { entries, remove } = useWatchlist();

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-muted rounded-full transition-colors bg-card border border-border/50">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold">Your Watchlist</h1>
        </div>
        <ThemeToggle />
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Your watchlist is empty.</p>
          <p className="text-sm mt-2">Swipe right on stocks to add them to your watchlist.</p>
          <Link href="/" className="inline-block mt-6 text-primary hover:underline">
            Go back to Discovery
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <WatchlistItem
              key={entry.symbol}
              entry={entry}
              onRemove={remove}
            />
          ))}
        </div>
      )}
    </main>
  );
}
