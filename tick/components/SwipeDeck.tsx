import { ReactNode, useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";

interface SwipeDeckProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function SwipeDeck({ children, onSwipeLeft, onSwipeRight }: SwipeDeckProps) {
  const [exitX, setExitX] = useState<number>(0);
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Rotate slightly as you drag
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  // Fade out slightly at the edges
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      setExitX(300);
      onSwipeRight();
    } else if (info.offset.x < -threshold) {
      setExitX(-300);
      onSwipeLeft();
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
        setExitX(-300);
        onSwipeLeft();
      } else if (e.key === "ArrowRight") {
        setExitX(300);
        onSwipeRight();
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
      </motion.div>
    </div>
  );
}
