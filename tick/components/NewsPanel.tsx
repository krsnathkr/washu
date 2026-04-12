import { memo } from "react";
import { NewsItem } from "@/lib/types";
import { ExternalLink } from "lucide-react";

export const NewsPanel = memo(function NewsPanel({ news, loading }: { news: NewsItem[] | null; loading: boolean }) {
  if (loading && !news) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4">
        <h3 className="font-semibold px-1">Recent News</h3>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 p-1">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!news) {
    return (
      <div className="px-4 py-4 border-t border-border">
        <h3 className="font-semibold px-1 mb-2">Recent News</h3>
        <p className="text-sm text-muted-foreground px-1">News unavailable.</p>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="px-4 py-4">
        <h3 className="font-semibold px-1 mb-2">Recent News</h3>
        <p className="text-sm text-muted-foreground px-1">No recent news available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4 border-t border-border">
      <h3 className="font-semibold px-1">Recent News</h3>
      <div className="flex flex-col gap-4">
        {news.map((item, idx) => {
          // rough relative time calculation
          const date = new Date(item.publishedAt);
          const diffHour = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
          const relTime = diffHour > 24 ? `${Math.floor(diffHour / 24)}d ago` : diffHour === 0 ? "Just now" : `${diffHour}h ago`;

          return (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex justify-between items-start group p-1 hover:bg-muted/50 rounded-md transition-colors"
            >
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-sm font-medium line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {item.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.source} • {relTime}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          );
        })}
      </div>
    </div>
  );
});
