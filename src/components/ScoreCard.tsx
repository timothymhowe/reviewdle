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
    letterboxd_url: string | null;
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
  const [open, setOpen] = useState(true);

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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] uppercase tracking-wider text-lbx-body hover:text-foreground transition-colors self-center mt-2"
      >
        results
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-background/80 z-40 animate-fade-in"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div
          className="bg-lbx-surface border border-lbx-border w-full max-w-[280px] relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* close */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2.5 right-3 text-lbx-body hover:text-foreground text-xs transition-colors"
          >
            &times;
          </button>

          {answer && (
            <>
              {/* poster — full width, no padding */}
              {answer.poster_url && (
                <img
                  src={`https://image.tmdb.org/t/p/w400${answer.poster_url}`}
                  alt={answer.title}
                  className="w-full border-b border-lbx-border"
                />
              )}

              {/* info */}
              <div className="p-4 flex flex-col gap-2.5">
                <div>
                  <div className="text-sm font-semibold text-foreground leading-tight">
                    {answer.title}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-lbx-body">
                    {answer.year && <span>{answer.year}</span>}
                    {answer.director && (
                      <>
                        <span className="text-lbx-border">/</span>
                        <span>{answer.director}</span>
                      </>
                    )}
                  </div>
                  {answer.genres && answer.genres.length > 0 && (
                    <div className="mt-1 text-[10px] text-lbx-muted">
                      {answer.genres.join(" / ")}
                    </div>
                  )}
                  {answer.letterboxd_url && (
                    <a
                      href={answer.letterboxd_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 text-[10px] text-lbx-blue hover:text-lbx-green transition-colors inline-block"
                    >
                      view on letterboxd &rarr;
                    </a>
                  )}
                </div>

                {/* score */}
                <div className="border-t border-lbx-border pt-3 text-sm">
                  {won ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lbx-green font-semibold text-sm">{scoreLabel}</span>
                      <span className="text-lbx-body text-[11px]">
                        {guesses.length}/{totalReviews} &middot; par {par}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lbx-body text-[11px]">
                      {totalReviews}/{totalReviews} &middot; par {par}
                    </span>
                  )}
                </div>

                {/* actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleShare}
                    className="border border-lbx-green text-lbx-green px-5 py-1.5 text-[10px] uppercase tracking-[0.12em] font-semibold transition-all hover:bg-lbx-green hover:text-background active:scale-[0.97]"
                  >
                    {copied ? "copied" : "share"}
                  </button>
                  <div className="text-[10px] text-lbx-body tracking-wide">
                    streak {streak.current} &middot; best {streak.max}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
