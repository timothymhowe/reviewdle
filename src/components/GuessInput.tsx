"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { TMDBSearchResult } from "@/types";

interface GuessInputProps {
  onGuess: (tmdbId: number, title: string) => void;
  disabled: boolean;
}

export default function GuessInput({ onGuess, disabled }: GuessInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data: TMDBSearchResult[] = await res.json();
      setResults(data);
      setShowDropdown(data.length > 0);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  function handleSelect(result: TMDBSearchResult) {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    onGuess(result.id, result.title);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    }
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        disabled={disabled}
        placeholder={disabled ? "" : "title"}
        className="w-full border-b border-lbx-border bg-transparent px-0 py-3 text-base text-foreground placeholder-lbx-body/40 outline-none transition-colors focus:border-lbx-green disabled:opacity-20 disabled:cursor-not-allowed"
      />
      {showDropdown && (
        <ul className="absolute z-10 mt-0 max-h-72 w-full overflow-auto border border-lbx-border bg-lbx-surface shadow-2xl shadow-black/50">
          {results.map((result, i) => {
            const year = result.release_date?.split("-")[0] || "";
            return (
              <li
                key={result.id}
                onMouseDown={() => handleSelect(result)}
                className={`cursor-pointer px-3 py-2 text-sm flex items-center gap-3 transition-colors ${
                  i === selectedIndex
                    ? "bg-lbx-green/8 text-foreground"
                    : "text-lbx-muted hover:text-foreground hover:bg-lbx-surface-light"
                }`}
              >
                {result.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                    alt=""
                    className="h-12 w-8 object-cover shrink-0"
                  />
                ) : (
                  <div className="h-12 w-8 bg-lbx-border/50 shrink-0" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-[13px] truncate">{result.title}</span>
                  {year && (
                    <span className="text-lbx-body text-[11px]">{year}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
