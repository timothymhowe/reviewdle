"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HowToPlayButton } from "@/components/HowToPlay";
import { getScoreLabel } from "@/lib/game";

interface ArchivePuzzle {
  id: string;
  puzzle_date: string;
  puzzle_number: number;
  movie: { par: number } | null;
}

interface GameState {
  puzzleId: string;
  status: "playing" | "won" | "lost";
  guesses: { tmdb_id: number; title: string; correct: boolean }[];
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS = ["su", "mo", "tu", "we", "th", "fr", "sa"];

export default function ArchivePage() {
  const router = useRouter();
  const [puzzles, setPuzzles] = useState<ArchivePuzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedMap, setCompletedMap] = useState<Record<string, GameState>>({});
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());

  useEffect(() => {
    fetch("/api/archive")
      .then((r) => r.json())
      .then((data) => {
        setPuzzles(data);
        setLoading(false);
      });

    const map: Record<string, GameState> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("reviewdle-state-")) {
        try {
          const state: GameState = JSON.parse(localStorage.getItem(key)!);
          if (state.puzzleId) map[state.puzzleId] = state;
        } catch { /* skip */ }
      }
    }
    setCompletedMap(map);
  }, []);

  const today = new Date().toISOString().split("T")[0];

  // build calendar grid for current month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // map puzzle dates to puzzle data for this month
  const puzzleByDate: Record<string, ArchivePuzzle> = {};
  for (const p of puzzles) {
    puzzleByDate[p.puzzle_date] = p;
  }

  // available years from puzzles
  const years = [...new Set(puzzles.map((p) => parseInt(p.puzzle_date.split("-")[0])))].sort();
  if (!years.includes(new Date().getFullYear())) years.push(new Date().getFullYear());

  return (
    <div className="flex flex-col flex-1 items-center font-sans min-h-screen">
      <header className="w-full border-b border-lbx-border">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight text-white lowercase font-sans flex items-center gap-2 no-underline">
            <svg width="56" height="28" viewBox="0 0 44 22" className="shrink-0">
              <defs>
                <clipPath id="c1"><rect width="12" height="12" transform="translate(7,11) rotate(-45)" /></clipPath>
                <clipPath id="c3"><rect width="12" height="12" transform="translate(25,11) rotate(-45)" /></clipPath>
              </defs>
              <rect width="12" height="12" transform="translate(7,11) rotate(-45)" fill="#40bcf4" />
              <rect width="12" height="12" transform="translate(16,11) rotate(-45)" fill="#00e054" />
              <rect width="12" height="12" transform="translate(25,11) rotate(-45)" fill="#ee7000" />
              <g clipPath="url(#c1)">
                <rect width="12" height="12" transform="translate(16,11) rotate(-45)" fill="white" />
              </g>
              <g clipPath="url(#c3)">
                <rect width="12" height="12" transform="translate(16,11) rotate(-45)" fill="white" />
              </g>
            </svg>
            reviewdle
          </a>
          <div className="flex items-center gap-3">
            <a href="/archive" className="px-2.5 py-1 bg-lbx-surface border border-lbx-border text-lbx-muted hover:text-foreground hover:border-lbx-muted hover:bg-lbx-surface-light transition-colors text-[10px] uppercase tracking-wider font-semibold no-underline">
              archive
            </a>
            <HowToPlayButton />
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-xl mx-auto px-5 py-6">
        {/* year + month nav */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (month === 0) { setMonth(11); setYear(year - 1); }
                else setMonth(month - 1);
              }}
              disabled={puzzles.length > 0 && (() => {
                const earliest = puzzles[puzzles.length - 1]?.puzzle_date;
                if (!earliest) return false;
                const [ey, em] = earliest.split("-").map(Number);
                return year === ey && month <= em - 1;
              })()}
              className="text-lbx-body hover:text-foreground transition-colors text-xs disabled:opacity-20"
            >
              &lsaquo;
            </button>
            <span className="text-sm font-semibold text-foreground w-24 text-center">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={() => {
                if (month === 11) { setMonth(0); setYear(year + 1); }
                else setMonth(month + 1);
              }}
              disabled={year === new Date().getFullYear() && month === new Date().getMonth()}
              className="text-lbx-body hover:text-foreground transition-colors text-xs disabled:opacity-20"
            >
              &rsaquo;
            </button>
          </div>
          {years.length > 1 && (
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="bg-lbx-surface border border-lbx-border text-[10px] text-lbx-muted px-2 py-1 outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="text-xs text-lbx-body animate-pulse">loading</div>
        ) : (
          <>
            {/* day headers */}
            <div className="grid grid-cols-7 gap-2.5 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-[9px] text-lbx-body/40 text-center uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* calendar grid */}
            <div className="grid grid-cols-7 gap-2.5">
              {/* empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const puzzle = puzzleByDate[dateStr];
                const isToday = dateStr === today;
                const isFuture = dateStr > today;
                const state = puzzle ? completedMap[puzzle.id] : null;
                const won = state?.status === "won";
                const lost = state?.status === "lost";

                if (!puzzle || isFuture) {
                  return (
                    <div
                      key={day}
                      className={`aspect-square flex items-center justify-center text-[10px] ${
                        isToday ? "text-lbx-green font-bold" : "text-lbx-body/20"
                      }`}
                    >
                      {day}
                    </div>
                  );
                }

                const par = puzzle.movie?.par || 3;
                const scoreLabel = won ? getScoreLabel(state!.guesses.length, par) : null;

                return (
                  <button
                    key={day}
                    onClick={() => router.push(isToday ? "/" : `/puzzle/${puzzle.puzzle_number}`)}
                    className={`aspect-square flex flex-col items-center justify-center gap-0.5 transition-colors border rounded-sm ${
                      won
                        ? "border-lbx-green/30 bg-lbx-green/10 text-lbx-green"
                        : lost
                          ? "border-lbx-orange/30 bg-lbx-orange/10 text-lbx-orange"
                          : isToday
                            ? "border-lbx-green text-lbx-green"
                            : "border-lbx-border text-lbx-muted hover:border-lbx-muted hover:text-foreground"
                    }`}
                  >
                    <span className="font-mono font-semibold text-[11px]">{puzzle.puzzle_number}</span>
                    {won && scoreLabel && (
                      <span className="text-[7px] uppercase tracking-wider opacity-80">{scoreLabel}</span>
                    )}
                    {lost && (
                      <span className="text-[7px] uppercase tracking-wider opacity-80">miss</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* legend */}
            <div className="flex items-center gap-4 mt-4 text-[9px] text-lbx-body/60">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 border border-lbx-green/30 bg-lbx-green/10" />
                <span>won</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 border border-lbx-orange/30 bg-lbx-orange/10" />
                <span>missed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 border border-lbx-border" />
                <span>unplayed</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
