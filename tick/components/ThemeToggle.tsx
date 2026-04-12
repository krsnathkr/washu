"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDarkStored = localStorage.getItem("tick:theme") === "dark" || 
      (!localStorage.getItem("tick:theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
    
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tick:theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tick:theme", "light");
    }
  };

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="size-10 rounded-full opacity-0 sm:size-8">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="size-10 rounded-full border-border/50 bg-card text-foreground shadow-md transition-colors hover:bg-muted sm:size-8"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
