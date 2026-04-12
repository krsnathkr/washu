"use client";

import { useState, useCallback } from "react";
import { CompareData, CompareVerdict } from "./types";

export interface UseCompareReturn {
  selectedSymbol: string | null;
  hoveredSymbol: string | null;
  compareData: CompareData | null;
  verdict: CompareVerdict | null;
  loading: boolean;
  verdictLoading: boolean;
  startCompare: (symbolA: string, symbolB: string) => void;
  selectForCompare: (symbol: string) => void;
  setHovered: (symbol: string | null) => void;
  clearCompare: () => void;
}

export function useCompare(): UseCompareReturn {
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);
  const [compareData, setCompareData] = useState<CompareData | null>(null);
  const [verdict, setVerdict] = useState<CompareVerdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [verdictLoading, setVerdictLoading] = useState(false);

  const clearCompare = useCallback(() => {
    setSelectedSymbol(null);
    setHoveredSymbol(null);
    setCompareData(null);
    setVerdict(null);
    setLoading(false);
    setVerdictLoading(false);
  }, []);

  const startCompare = useCallback(
    (symbolA: string, symbolB: string) => {
      if (symbolA === symbolB) return;

      setSelectedSymbol(null);
      setHoveredSymbol(null);
      setLoading(true);
      setCompareData(null);
      setVerdict(null);

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

          // Fetch AI verdict in the background
          setVerdictLoading(true);
          return fetch("/api/gemini/compare", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
        })
        .then((r) => {
          if (!r || !r.ok) throw new Error("Failed to fetch AI verdict");
          return r.json();
        })
        .then((v: CompareVerdict) => {
          setVerdict(v);
          setVerdictLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setVerdictLoading(false);
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
    verdict,
    loading,
    verdictLoading,
    startCompare,
    selectForCompare,
    setHovered,
    clearCompare,
  };
}
