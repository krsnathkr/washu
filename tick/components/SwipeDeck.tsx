import { ReactNode, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { ArrowLeft, Heart, Undo2 } from "lucide-react";

interface SwipeDeckProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo?: () => void;
  undoDisabled?: boolean;
}

export function SwipeDeck({
  children,
  onSwipeLeft,
  onSwipeRight,
  onUndo,
  undoDisabled = false,
}: SwipeDeckProps) {
  const [exitX, setExitX] = useState<number>(0);
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Rotate slightly as you drag
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  // Fade out slightly at the edges
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const triggerSwipe = (direction: "left" | "right") => {
    setExitX(direction === "right" ? 300 : -300);

    if (direction === "right") {
      onSwipeRight();
      return;
    }

    onSwipeLeft();
  };

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      triggerSwipe("right");
    } else if (info.offset.x < -threshold) {
      triggerSwipe("left");
    } else {
      // Spring back
      controls.start({ x: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "ArrowLeft") {
        triggerSwipe("left");
      } else if (e.key === "ArrowRight") {
        triggerSwipe("right");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSwipeLeft, onSwipeRight]);

  return (
    <div className="relative w-full max-w-5xl h-[85vh] perspective-[1000px] flex items-center justify-center">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }} /* lets it be freely dragged but origin is 0 */
        dragElastic={0.8}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, rotate, opacity }}
        exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
      >
        {children}
        <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 flex -translate-x-1/2 translate-y-1/2 items-center gap-3 sm:gap-4">
          <button
            type="button"
            aria-label="Swipe left"
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full border border-border/70 bg-card/95 text-destructive shadow-xl backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-95 sm:size-16"
            onPointerDownCapture={(event) => event.stopPropagation()}
            onClick={() => triggerSwipe("left")}
          >
            <ArrowLeft className="size-6 sm:size-7" />
          </button>
          <button
            type="button"
            aria-label="Undo last swipe"
            className="pointer-events-auto flex size-12 items-center justify-center rounded-full border border-border/70 bg-background/95 text-foreground shadow-lg backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 sm:size-14"
            disabled={undoDisabled}
            onPointerDownCapture={(event) => event.stopPropagation()}
            onClick={onUndo}
          >
            <Undo2 className="size-5 sm:size-6" />
          </button>
          <button
            type="button"
            aria-label="Swipe right"
            className="pointer-events-auto flex size-14 items-center justify-center rounded-full border border-border/70 bg-card/95 text-primary shadow-xl backdrop-blur transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02] active:scale-95 sm:size-16"
            onPointerDownCapture={(event) => event.stopPropagation()}
            onClick={() => triggerSwipe("right")}
          >
            <Heart className="size-6 fill-current sm:size-7" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
