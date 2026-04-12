import { WatchlistEntry } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useStockCard } from "@/lib/useStockCard";

export function WatchlistItem({
  entry,
  onRemove,
}: {
  entry: WatchlistEntry;
  onRemove: (symbol: string) => void;
}) {
  const { stock } = useStockCard(entry.symbol);
  const loading = stock.loading;
  
  const price = stock?.data?.price;
  const change = stock?.data?.change;
  const changePct = stock?.data?.changePct;

  const isPositive = change && change >= 0;

  return (
    <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
      <Link href={`/ticker/${entry.symbol}`} className="flex-1">
        <div className="flex flex-col">
          <span className="font-bold text-lg">{entry.symbol}</span>
          <span className="text-sm text-muted-foreground">{entry.name}</span>
        </div>
      </Link>
      
      <div className="flex items-center gap-4">
        {!loading && price !== undefined ? (
           <div className="text-right">
             <div className="font-medium">${price.toFixed(2)}</div>
             <div className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
               {isPositive ? '+' : ''}{change?.toFixed(2)} ({changePct?.toFixed(2)}%)
             </div>
           </div>
        ) : (
           <div className="text-right animate-pulse flex flex-col items-end">
             <div className="h-5 bg-muted rounded w-16 mb-1"></div>
             <div className="h-4 bg-muted rounded w-12"></div>
           </div>
        )}
        <Button variant="ghost" size="icon" onClick={(e) => {
          e.preventDefault();
          onRemove(entry.symbol);
        }}>
          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
        </Button>
      </div>
    </Card>
  );
}
