import { memo, ReactNode, useEffect, useEffectEvent, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { ArrowLeft, Heart, Undo2 } from "lucide-react";

interface SwipeDeckProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onUndo?: () => void;
  undoDisabled?: boolean;
}

export const SwipeDeck = memo(function SwipeDeck({
  children,
  onSwipeLeft,
  onSwipeRight,
  onUndo,
  undoDisabled = false,
}: SwipeDeckProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const swipingRef = useRef(false);
  const onSwipeLeftEvent = useEffectEvent(onSwipeLeft);
  const onSwipeRightEvent = useEffectEvent(onSwipeRight);

  // Rotate slightly as you drag
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  // Fade a bit more as the swipe commits so the card feels lighter at the edges.
  const opacity = useTransform(x, [-220, -120, 0, 120, 220], [0.62, 0.82, 1, 0.82, 0.62]);
  const leftTintOpacity = useTransform(x, [-220, -80, 0], [0.24, 0.1, 0]);
  const rightTintOpacity = useTransform(x, [0, 80, 220], [0, 0.1, 0.24]);

  const triggerSwipe = useEffectEvent(async (direction: "left" | "right") => {
    if (swipingRef.current) return; // guard against double-fires
    swipingRef.current = true;

    const exitTarget = direction === "right" ? 300 : -300;

    // Animate card off-screen imperatively — no setState, no re-render
    await controls.start({
      x: exitTarget,
      opacity: 0,
      transition: { duration: 0.2 },
    });

    // Fire the callback *after* the animation completes
    if (direction === "right") {
      onSwipeRightEvent();
    } else {
      onSwipeLeftEvent();
    }
  });

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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

  // Keyboard handler — attaches once thanks to refs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") triggerSwipe("left");
      else if (e.key === "ArrowRight") triggerSwipe("right");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-5xl h-[85vh] perspective-[1000px] flex items-center justify-center">
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x, rotate, opacity, backfaceVisibility: "hidden" }}
        exit={{}}
        className="absolute inset-0 cursor-grab active:cursor-grabbing flex items-center justify-center will-change-transform"
      >
        <div className="relative h-full w-full max-w-5xl overflow-hidden rounded-3xl">
          {children}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-rose-500"
            style={{ opacity: leftTintOpacity }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-emerald-500"
            style={{ opacity: rightTintOpacity }}
          />
        </div>
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
});
