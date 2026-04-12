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
    <main className="flex-1 flex flex-col items-center flex-grow bg-background relative overflow-hidden min-h-screen">
      
      <div className="absolute top-4 left-4 z-10 w-full flex justify-between px-4 pointer-events-none pr-8">
        <Link href="/lists" className="pointer-events-auto bg-card text-foreground p-2 rounded-full shadow-md border border-border/50 hover:bg-muted transition-colors flex items-center gap-2">
           <ArrowLeft className="w-5 h-5" />
           <span className="text-sm font-semibold pr-2">Back</span>
        </Link>
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center p-4 pt-16 pb-24 relative overflow-hidden h-full">
         <div className="w-full max-w-md h-full min-h-[600px] flex items-stretch justify-center relative">
            <StockCard symbol={resolvedSymbol} />
         </div>
      </div>

      <ChatBar symbol={resolvedSymbol} stats={stock?.data} />
      
    </main>
  );
}
