"use client";

import * as React from "react";
import { motion, useMotionValue, PanInfo } from "framer-motion";
import { WatchlistItem } from "@/components/WatchlistItem";
import { SavedStockEntry } from "@/lib/types";

interface DraggableWatchlistItemProps {
  entry: SavedStockEntry;
  onRemove: (symbol: string) => void;
  /** This card is being hovered over by a dragged card */
  isDropTarget: boolean;
  /** This card is selected for comparison (mobile tap) */
  isSelected: boolean;
  /** Called during drag with the symbol of the card underneath the pointer */
  onDragOverSymbol: (symbol: string | null) => void;
  /** Called when this card is dropped on another card */
  onDropOnSymbol: (targetSymbol: string, draggedSymbol: string) => void;
  /** Called when this card is tapped (mobile compare mode) */
  onTapSelect: () => void;
  /** Ref map so the parent can track all card positions */
  registerRect: (symbol: string, el: HTMLDivElement | null) => void;
  /** All registered rects for hit-testing during drag */
  rectMap: React.RefObject<Map<string, DOMRect>>;
  /** Whether the device is touch-primary */
  isTouchDevice: boolean;
}

export function DraggableWatchlistItem({
  entry,
  onRemove,
  isDropTarget,
  isSelected,
  onDragOverSymbol,
  onDropOnSymbol,
  onTapSelect,
  registerRect,
  rectMap,
  isTouchDevice,
}: DraggableWatchlistItemProps) {
  const dragOccurred = React.useRef(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const elRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      registerRect(entry.symbol, node);
    },
    [entry.symbol, registerRect],
  );

  const handleDrag = (_: unknown, info: PanInfo) => {
    dragOccurred.current = true;

    // Find which card is under the pointer using stored rects
    const map = rectMap.current;
    if (!map) return;

    const pointerX = info.point.x;
    const pointerY = info.point.y;

    let found: string | null = null;
    map.forEach((rect, sym) => {
      if (sym === entry.symbol) return;
      if (
        pointerX >= rect.left &&
        pointerX <= rect.right &&
        pointerY >= rect.top &&
        pointerY <= rect.bottom
      ) {
        found = sym;
      }
    });

    onDragOverSymbol(found);
  };

  const handleDragStart = () => {
    dragOccurred.current = false;
    setIsDragging(true);
    // Snapshot all rects at drag start for stable hit-testing
    const map = rectMap.current;
    if (!map) return;
    // The parent will have already populated the map, but refresh positions
    document.querySelectorAll<HTMLDivElement>("[data-stock-symbol]").forEach((el) => {
      const sym = el.dataset.stockSymbol;
      if (sym) map.set(sym, el.getBoundingClientRect());
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragOverSymbol(null);
    // Check if we were hovering over a target
    const map = rectMap.current;
    if (!map) return;

    const curX = x.get();
    const curY = y.get();

    // Get our own rect and compute where the center ended up
    const myRect = map.get(entry.symbol);
    if (!myRect) return;

    const centerX = myRect.left + myRect.width / 2 + curX;
    const centerY = myRect.top + myRect.height / 2 + curY;

    let target: string | null = null;
    map.forEach((rect, sym) => {
      if (sym === entry.symbol) return;
      if (
        centerX >= rect.left &&
        centerX <= rect.right &&
        centerY >= rect.top &&
        centerY <= rect.bottom
      ) {
        target = sym;
      }
    });

    if (target) {
      onDropOnSymbol(target, entry.symbol);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (dragOccurred.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (isTouchDevice) {
      e.preventDefault();
      e.stopPropagation();
      onTapSelect();
    }
  };

  return (
    <div
      ref={elRef}
      data-stock-symbol={entry.symbol}
      className={`relative ${isDragging ? "z-50" : ""}`}
    >
      {isTouchDevice ? (
        // Mobile: no drag, tap to select
        <div
          onClick={handleClick}
          className={`rounded-xl transition-all ${
            isSelected
              ? "ring-2 ring-primary shadow-lg shadow-primary/10"
              : isDropTarget
                ? "ring-2 ring-primary animate-pulse"
                : ""
          }`}
        >
          {isSelected && (
            <div className="absolute -top-2 -right-2 z-10 flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow">
              1
            </div>
          )}
          <WatchlistItem entry={entry} onRemove={onRemove} />
        </div>
      ) : (
        // Desktop: draggable
        <motion.div
          drag
          dragSnapToOrigin
          dragMomentum={false}
          style={{ x, y }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileDrag={{
            scale: 1.05,
            zIndex: 50,
            boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            pointerEvents: "none" as const,
          }}
          className={`relative cursor-grab rounded-xl transition-shadow active:cursor-grabbing ${
            isDropTarget
              ? "ring-2 ring-primary shadow-lg shadow-primary/20"
              : ""
          }`}
          onClick={handleClick}
        >
          {isDropTarget && (
            <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground shadow">
              Drop to compare
            </div>
          )}
          <WatchlistItem entry={entry} onRemove={onRemove} />
        </motion.div>
      )}
    </div>
  );
}
