"use client";

import { useState, useCallback } from "react";
import { CompareData } from "./types";

export interface UseCompareReturn {
  selectedSymbol: string | null;
  hoveredSymbol: string | null;
  compareData: CompareData | null;
  loading: boolean;
  startCompare: (symbolA: string, symbolB: string) => void;
  selectForCompare: (symbol: string) => void;
  setHovered: (symbol: string | null) => void;
  clearCompare: () => void;
}

export function useCompare(): UseCompareReturn {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);

  const clearCompare = useCallback(() => {
    setSelectedSymbol(null);
    setHoveredSymbol(null);
    setCompareData(null);
    setLoading(false);
  }, []);

  const startCompare = useCallback(
    (symbolA: string, symbolB: string) => {
      if (symbolA === symbolB) return;

      setSelectedSymbol(null);
      setHoveredSymbol(null);
      setLoading(true);
      setCompareData(null);

      fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbolA, symbolB }),
      })
        .then((r) => {
          if (!r.ok) throw new Error("Failed to fetch comparison data");
          return r.json();
        })
        .then((data: CompareData) => {
          setCompareData(data);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    },
    [],
  );

  const selectForCompare = useCallback(
    (symbol: string) => {
      if (selectedSymbol === symbol) {
        // Deselect
        setSelectedSymbol(null);
      } else if (selectedSymbol) {
        // Second selection → trigger compare
        startCompare(selectedSymbol, symbol);
      } else {
        // First selection
        setSelectedSymbol(symbol);
      }
    },
    [selectedSymbol, startCompare],
  );

  const setHovered = useCallback((symbol: string | null) => {
    setHoveredSymbol(symbol);
  }, []);

  return {
    selectedSymbol,
    hoveredSymbol,
    compareData,
    loading,
    startCompare,
    selectForCompare,
    setHovered,
    clearCompare,
  };
}
