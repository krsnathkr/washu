import { useState, useRef, useEffect } from "react";
import { Send, X, MessageCircle } from "lucide-react";
import { StockSnapshot } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatBar({ symbol, stats }: { symbol: string; stats: StockSnapshot | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Clear messages when symbol changes
  useEffect(() => {
    setMessages([]);
    setIsOpen(false);
    setInput("");
  }, [symbol]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading || !symbol) return;

    const userQ = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userQ }]);
    setIsOpen(true);
    setLoading(true);

    try {
      const context = {
        symbol,
        name: stats?.name || "",
        stats: JSON.stringify({
          price: stats?.price,
          pe: stats?.pe,
          marketCap: stats?.marketCap,
        }),
      };

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...context, question: userQ }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I ran into an error." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none pb-4 px-4">
      <div className="w-full max-w-sm sm:max-w-md pointer-events-auto flex flex-col gap-2 relative">

        {/* Drawer */}
        {isOpen && (
          <div className="bg-card w-full rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col mb-2 h-96 transition-all duration-300">
            <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-muted/30">
              <span className="font-semibold text-sm flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                Ask about {symbol}
              </span>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Ask me anything about {symbol}'s fundamentals or news.
                </div>
              )}
              {messages.map((m, idx) => (
                <div key={idx} className={`flex flex-col text-sm max-w-[85%] ${m.role === "user" ? "self-end items-end" : "self-start items-start"}`}>
                  <div className={`px-3 py-2 rounded-2xl ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border border-border"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="self-start px-3 py-2 rounded-2xl bg-muted text-foreground border border-border text-sm flex gap-1">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Pill */}
        <form onSubmit={handleSubmit} className="relative w-full shadow-lg rounded-full bg-card border border-border/50 flex items-center overflow-hidden">
          <input
            type="text"
            className="w-full py-3.5 pl-5 pr-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground placeholder:select-none"
            placeholder={`Ask anything about ${symbol}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => {
              // optionally open drawer immediately if there are messages
              if (messages.length > 0) setIsOpen(true);
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 transition-opacity"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>

      </div>
    </div>
  );
}
