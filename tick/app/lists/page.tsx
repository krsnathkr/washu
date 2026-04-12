"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ListPlus, PencilLine, X } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TickWordmark } from "@/components/TickWordmark";
import { DraggableWatchlistItem } from "@/components/DraggableWatchlistItem";
import { CompareOverlay } from "@/components/CompareOverlay";
import { ListEditorDialog } from "@/components/ListEditorDialog";
import { Button } from "@/components/ui/button";
import {
  getRandomListEmoji,
  useLists,
  WATCHLIST_ID,
} from "@/lib/lists";
import { useCompare } from "@/lib/useCompare";

type EditorState =
  | { mode: "create" }
  | { mode: "edit"; listId: string }
  | null;

export default function ListsPage() {
  const listsStore = useLists();
  const [editorState, setEditorState] = useState<EditorState>(null);
  const compare = useCompare();
  const rectMap = useRef<Map<string, DOMRect>>(new Map());

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const registerRect = useCallback(
    (symbol: string, el: HTMLDivElement | null) => {
      if (el) {
        rectMap.current.set(symbol, el.getBoundingClientRect());
      } else {
        rectMap.current.delete(symbol);
      }
    },
    [],
  );

  const openCreateEditor = () => {
    setEditorState({ mode: "create" });
  };

  const openEditEditor = (listId: string) => {
    setEditorState({ mode: "edit", listId });
  };

  const editingList =
    editorState?.mode === "edit"
      ? listsStore.lists.find((list) => list.id === editorState.listId) ?? null
      : null;

  const hasSavedStocks = listsStore.lists.some((list) => list.entries.length > 0);

  return (
    <main className="min-h-[100svh] bg-background px-4 py-4 [padding-top:calc(env(safe-area-inset-top)+1rem)] [padding-bottom:calc(env(safe-area-inset-bottom)+1rem)] md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-start gap-3">
            <TickWordmark />
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="rounded-full border border-border/50 bg-card p-2 transition-colors hover:bg-muted"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Lists</h1>
                <p className="text-sm text-muted-foreground">
                  Watchlist stays built in, and custom lists live here too.
                </p>
              </div>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-full px-4 sm:w-auto"
              onClick={openCreateEditor}
            >
              <ListPlus className="size-4" />
              Create List
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {!hasSavedStocks && listsStore.lists.length === 1 && (
          <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 px-6 py-10 text-center">
            <p className="text-lg font-medium">No saved stocks yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Swipe right to fill your Watchlist, then use the stock card menu to organize custom lists.
            </p>
            <Link href="/" className="mt-6 inline-block text-primary hover:underline">
              Go back to Discovery
            </Link>
          </div>
        )}

        <div className="space-y-5">
          {listsStore.lists.map((list) => (
            <section
              key={list.id}
              className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex size-14 items-center justify-center rounded-3xl bg-muted/60 text-3xl shadow-inner">
                    {list.emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-semibold tracking-tight">{list.name}</h2>
                      {list.id === WATCHLIST_ID && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {list.entries.length} {list.entries.length === 1 ? "stock" : "stocks"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 rounded-full px-4 self-start"
                  onClick={() => openEditEditor(list.id)}
                >
                  <PencilLine className="size-4" />
                  Edit
                </Button>
              </div>

              <div className="px-4 py-4 md:px-5 md:py-5">
                {list.entries.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/60 bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground">
                    {list.id === WATCHLIST_ID
                      ? "Swipe right on a stock to add it to Watchlist."
                      : "Use the three-dot menu on a stock card to add tickers to this list."}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {list.entries.map((entry) => (
                      <DraggableWatchlistItem
                        key={`${list.id}-${entry.symbol}`}
                        entry={entry}
                        onRemove={(symbol) => {
                          const removed = listsStore.removeFromList(list.id, symbol);
                          if (removed) {
                            toast(`Removed ${symbol} from ${list.name}`);
                          }
                        }}
                        isDropTarget={compare.hoveredSymbol === entry.symbol}
                        isSelected={compare.selectedSymbol === entry.symbol}
                        onDragOverSymbol={compare.setHovered}
                        onDropOnSymbol={(targetSymbol, draggedSymbol) => {
                          compare.startCompare(draggedSymbol, targetSymbol);
                        }}
                        onTapSelect={() => compare.selectForCompare(entry.symbol)}
                        registerRect={registerRect}
                        rectMap={rectMap}
                        isTouchDevice={isTouchDevice}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {editorState?.mode === "create" && (
        <ListEditorDialog
          key="create-list"
          mode="create"
          defaultEmoji={getRandomListEmoji()}
          onClose={() => setEditorState(null)}
          onSubmit={({ name, emoji }) => {
            const list = listsStore.createList(name, emoji);
            toast.success(`Created ${list.name}`);
            setEditorState(null);
          }}
        />
      )}

      {editorState?.mode === "edit" && editingList && (
        <ListEditorDialog
          key={`edit-${editingList.id}`}
          mode="edit"
          defaultName={editingList.name}
          defaultEmoji={editingList.emoji}
          nameLocked={editingList.id === WATCHLIST_ID}
          onClose={() => setEditorState(null)}
          onSubmit={({ name, emoji }) => {
            const updated = listsStore.updateList(editingList.id, { name, emoji });
            if (updated) {
              toast.success(`Updated ${updated.name}`);
            }
            setEditorState(null);
          }}
        />
      )}

      {/* Compare overlay */}
      {(compare.loading || compare.compareData) && (
        <CompareOverlay
          data={compare.compareData}
          loading={compare.loading}
          onClose={compare.clearCompare}
        />
      )}

      {/* Mobile selection pill */}
      {compare.selectedSymbol && !compare.compareData && !compare.loading && (
        <div className="fixed left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-2 shadow-xl [bottom:calc(env(safe-area-inset-bottom)+1rem)]">
          <span className="text-sm font-medium">
            <span className="font-bold text-primary">{compare.selectedSymbol}</span>
            {" "}selected — tap another to compare
          </span>
          <button
            onClick={compare.clearCompare}
            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Cancel selection"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </main>
  );
}
