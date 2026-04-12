"use client";

import { use } from "react";
import { StockCard } from "@/components/StockCard";
import { ChatBar } from "@/components/ChatBar";
import { useStockCard } from "@/lib/useStockCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const resolvedSymbol = symbol.toUpperCase();
  const { stock } = useStockCard(resolvedSymbol);

  return (
    <main className="relative flex min-h-[100svh] flex-1 flex-col items-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 [padding-top:calc(env(safe-area-inset-top)+1rem)]">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <Link
            href="/lists"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-border/50 bg-card px-3.5 py-2.5 text-foreground shadow-md transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="pr-1 text-sm font-semibold">Back</span>
          </Link>
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="relative flex w-full flex-1 items-start justify-center overflow-hidden px-4 pt-20 pb-[4.75rem] sm:items-center sm:pt-24 sm:pb-32">
         <div
           aria-hidden="true"
           className="pointer-events-none absolute inset-0"
           style={{
             backgroundImage:
               `repeating-linear-gradient(0deg, var(--border) 0 0.5px, transparent 0.5px 100%),
                repeating-linear-gradient(90deg, var(--border) 0 0.5px, transparent 0.5px 100%)`,
             backgroundSize: "48px 48px",
             opacity: 0.3,
           }}
         />
         <div className="relative flex h-full min-h-0 w-full max-w-md items-stretch justify-center md:max-w-5xl">
            <StockCard symbol={resolvedSymbol} />
         </div>
      </div>

      <ChatBar symbol={resolvedSymbol} stats={stock?.data} />
      
    </main>
  );
}
