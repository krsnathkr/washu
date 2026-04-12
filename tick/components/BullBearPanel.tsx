import { memo } from "react";
import { BullBear } from "@/lib/types";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export const BullBearPanel = memo(function BullBearPanel({ data, loading }: { data: BullBear | null; loading: boolean }) {
  if (loading && !data) {
    return (
      <div className="flex flex-col gap-4 border-t border-border px-4 py-5 sm:px-5 sm:py-4">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h4 className="font-medium text-sm text-chart-1 flex items-center gap-1">
              <ArrowUpCircle className="w-4 h-4" /> Bull Case
            </h4>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 w-full bg-muted animate-pulse rounded" />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="font-medium text-sm text-destructive flex items-center gap-1">
              <ArrowDownCircle className="w-4 h-4" /> Bear Case
            </h4>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 w-full bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col gap-4 border-t border-border px-4 py-5 text-sm text-muted-foreground sm:px-5 sm:py-4">
        Bull/Bear analysis unavailable.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 border-t border-border px-4 py-5 sm:px-5 sm:py-4">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h4 className="font-medium text-sm text-chart-1 flex items-center gap-1 mb-1">
            <ArrowUpCircle className="w-4 h-4" /> Bull Case
          </h4>
          <ul className="text-sm space-y-2 list-outside ml-3 flex flex-col gap-1">
            {data.bull.map((bullet, idx) => (
              <li key={idx} className="relative before:content-['•'] before:absolute before:-left-3 before:text-chart-1">
                <span className="text-muted-foreground">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className="font-medium text-sm text-destructive flex items-center gap-1 mb-1">
            <ArrowDownCircle className="w-4 h-4" /> Bear Case
          </h4>
          <ul className="text-sm space-y-2 list-outside ml-3 flex flex-col gap-1">
            {data.bear.map((bullet, idx) => (
              <li key={idx} className="relative before:content-['•'] before:absolute before:-left-3 before:text-destructive">
                <span className="text-muted-foreground">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {data.analyst && (
        <div className="bg-muted/30 p-3 rounded-md text-sm border border-border/50">
          <span className="font-semibold mr-2 text-foreground">Analyst View:</span>
          <span className="text-muted-foreground">{data.analyst}</span>
        </div>
      )}
    </div>
  );
});
