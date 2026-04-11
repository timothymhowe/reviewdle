"use client";

import { useState, useEffect } from "react";
import type { Guess, GameStatus } from "@/types";
import { getScoreLabel, generateShareText, updateStreak } from "@/lib/game";

interface ScoreCardProps {
  status: GameStatus;
  guesses: Guess[];
  totalReviews: number;
  par: number;
  puzzleNumber: number;
  answer: {
    title: string;
    year: number | null;
    poster_url: string | null;
    director: string | null;
    genres: string[] | null;
  } | null;
}

export default function ScoreCard({
  status,
  guesses,
  totalReviews,
  par,
  puzzleNumber,
  answer,
}: ScoreCardProps) {
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState({ current: 0, max: 0 });

  useEffect(() => {
    const s = updateStreak(status === "won");
    setStreak(s);
  }, [status]);

  const won = status === "won";
  const scoreLabel = won ? getScoreLabel(guesses.length, par) : null;

  async function handleShare() {
    const text = generateShareText(
      puzzleNumber,
      guesses,
      totalReviews,
      par,
      status
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="animate-fade-in border-t border-lbx-border pt-6 mt-2">
      {answer && (
        <div className="flex gap-5">
          {answer.poster_url && (
            <img
              src={`https://image.tmdb.org/t/p/w300${answer.poster_url}`}
              alt={answer.title}
              className="h-52 w-auto shrink-0 shadow-lg shadow-black/40"
            />
          )}
          <div className="flex flex-col justify-between py-1">
            <div>
              <div className="text-lg font-semibold text-foreground leading-tight">
                {answer.title}
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-lbx-body">
                {answer.year && <span>{answer.year}</span>}
                {answer.director && (
                  <>
                    <span className="text-lbx-border">/</span>
                    <span>{answer.director}</span>
                  </>
                )}
              </div>
              {answer.genres && answer.genres.length > 0 && (
                <div className="mt-2 text-[11px] text-lbx-muted">
                  {answer.genres.join(" / ")}
                </div>
              )}
              <div className="mt-4 text-sm">
                {won ? (
                  <div>
                    <span className="text-lbx-green font-medium">{scoreLabel}</span>
                    <span className="text-lbx-body ml-2 text-xs">
                      {guesses.length}/{totalReviews} &middot; par {par}
                    </span>
                  </div>
                ) : (
                  <span className="text-lbx-body text-xs">
                    {totalReviews}/{totalReviews} &middot; par {par}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={handleShare}
                className="border border-lbx-green text-lbx-green px-4 py-1.5 text-[11px] uppercase tracking-[0.1em] font-semibold transition-all hover:bg-lbx-green hover:text-background active:scale-[0.97]"
              >
                {copied ? "copied" : "share"}
              </button>
              <div className="text-[10px] text-lbx-body tracking-wide">
                streak {streak.current} &middot; best {streak.max}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
