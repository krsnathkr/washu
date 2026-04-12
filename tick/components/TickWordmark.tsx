import Link from "next/link";
import { cn } from "@/lib/utils";

type TickWordmarkProps = {
  href?: string;
  className?: string;
};

export function TickWordmark({
  href = "/",
  className,
}: TickWordmarkProps) {
  return (
    <Link
      href={href}
      aria-label="Go to Tick home"
      className={cn(
        "inline-flex items-center px-1 text-foreground transition-all hover:-translate-y-0.5",
        className,
      )}
    >
      <span
        className="text-[2.4rem] lowercase leading-none drop-shadow-[0_8px_20px_rgba(0,0,0,0.12)] sm:text-[2.8rem]"
        style={{ fontFamily: "var(--font-wordmark)" }}
      >
        tick
      </span>
    </Link>
  );
}
