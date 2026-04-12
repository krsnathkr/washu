"use client";

import * as React from "react";
import { Check, ListPlus, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ListEditorDialog } from "@/components/ListEditorDialog";
import { getRandomListEmoji, useLists } from "@/lib/lists";
import { cn } from "@/lib/utils";

export function StockListMenu({
  symbol,
  name,
}: {
  symbol: string;
  name?: string;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listsStore = useLists();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [createSeed, setCreateSeed] = React.useState(0);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const defaultName = name?.trim() || symbol;

  const handleToggleList = (listId: string, listName: string) => {
    const wasSaved = listsStore.isInList(listId, symbol);
    const isSavedNow = listsStore.toggleInList(listId, symbol, defaultName);

    if (isSavedNow) {
      toast.success(`Added ${symbol} to ${listName}`);
      return;
    }

    if (wasSaved) {
      toast(`Removed ${symbol} from ${listName}`);
    }
  };

  const openCreateDialog = () => {
    setCreateSeed((seed) => seed + 1);
    setIsCreating(true);
    setIsOpen(false);
  };

  return (
    <>
      <div ref={rootRef} className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={`Manage lists for ${symbol}`}
          className="rounded-full border border-border/60 bg-card/90 shadow-sm hover:bg-muted"
        >
          <MoreHorizontal className="size-4" />
        </Button>

        {isOpen && (
          <div className="absolute right-0 top-11 z-50 w-72 rounded-3xl border border-border/60 bg-popover p-3 text-popover-foreground shadow-2xl">
            <div className="mb-3 px-1">
              <p className="text-sm font-semibold">Save {symbol}</p>
              <p className="text-xs text-muted-foreground">
                Add this stock to one or more lists.
              </p>
            </div>

            <div className="space-y-1">
              {listsStore.lists.map((list) => {
                const isSaved = listsStore.isInList(list.id, symbol);

                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => handleToggleList(list.id, list.name)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-muted",
                      isSaved && "bg-primary/10"
                    )}
                  >
                    <span className="text-xl leading-none">{list.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{list.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {list.entries.length} {list.entries.length === 1 ? "stock" : "stocks"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border border-border/60 text-muted-foreground",
                        isSaved && "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {isSaved ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 border-t border-border/60 pt-3">
              <Button
                type="button"
                variant="ghost"
                className="h-10 w-full justify-start rounded-2xl px-3"
                onClick={openCreateDialog}
              >
                <ListPlus className="size-4" />
                Create list
              </Button>
            </div>
          </div>
        )}
      </div>

      {isCreating && (
        <ListEditorDialog
          key={`create-list-${createSeed}`}
          mode="create"
          defaultEmoji={getRandomListEmoji()}
          onClose={() => setIsCreating(false)}
          onSubmit={({ name: listName, emoji }) => {
            const list = listsStore.createList(listName, emoji);
            listsStore.addToList(list.id, symbol, defaultName);
            toast.success(`Created ${list.name} and added ${symbol}`);
            setIsCreating(false);
          }}
        />
      )}
    </>
  );
}
