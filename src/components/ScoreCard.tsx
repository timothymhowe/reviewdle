"use client";

import { useState, useEffect } from "react";
import type { Guess, GameStatus } from "@/types";
import { getScoreLabel, getScoreToPar, generateShareText, updateStreak } from "@/lib/game";

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
    cast_members: string[] | null;
    genres: string[] | null;
    studio: string | null;
    letterboxd_url: string | null;
  } | null;
  freshResult?: boolean;
}

function ResultContent({
  answer,
  won,
  scoreLabel,
  guesses,
  totalReviews,
  par,
  streak,
  copied,
  onShare,
}: {
  answer: NonNullable<ScoreCardProps["answer"]>;
  won: boolean;
  scoreLabel: string | null;
  guesses: Guess[];
  totalReviews: number;
  par: number;
  streak: { current: number; max: number };
  copied: boolean;
  onShare: () => void;
}) {
  return (
    <>
      <div className="py-1.5 px-4 text-center">
        {won ? (
          <div className="text-lg font-bold text-white">you got it!</div>
        ) : (
          <div className="text-lg font-bold text-white">better luck next time</div>
        )}
      </div>
      {answer.poster_url && (
        <img
          src={`https://image.tmdb.org/t/p/w400${answer.poster_url}`}
          alt={answer.title}
          className="w-full border-b border-lbx-border"
        />
      )}
      <div className="p-4 flex flex-col gap-2.5">
        <div>
          <div className="text-sm font-semibold text-foreground leading-tight">
            {answer.title}{answer.year && <span className="font-normal text-lbx-muted ml-1">({answer.year})</span>}
          </div>
          {answer.genres && answer.genres.length > 0 && (
            <div className="text-[10px] text-lbx-muted">{answer.genres.join(" / ")}</div>
          )}
          {answer.director && (
            <div className="text-[10px] text-foreground/70">{answer.director}</div>
          )}
          {answer.cast_members && answer.cast_members.length > 0 && (
            <div className="text-[10px] text-foreground/50">{answer.cast_members.join(", ")}</div>
          )}
          {answer.studio && (
            <div className="text-[10px] text-lbx-muted/60">{answer.studio}</div>
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
        <div className="border-t border-lbx-border pt-3">
          {won ? (
            <div className="flex items-baseline gap-2">
              <span className="text-lbx-green font-semibold text-sm">{scoreLabel}</span>
              <span className="text-lbx-body text-[11px]">
                {guesses.length}/{totalReviews} &middot; par {par} &middot; {getScoreToPar(guesses.length, par)}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-red-400 font-semibold text-sm">{getScoreLabel(totalReviews + 1, par)}</span>
              <span className="text-lbx-body text-[11px]">
                {totalReviews}/{totalReviews} &middot; par {par} &middot; {getScoreToPar(totalReviews + 1, par)}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={onShare}
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
  );
}

export default function ScoreCard({
  status,
  guesses,
  totalReviews,
  par,
  puzzleNumber,
  answer,
  freshResult,
}: ScoreCardProps) {
  const [copied, setCopied] = useState(false);
  const [streak, setStreak] = useState({ current: 0, max: 0 });
  const [showModal, setShowModal] = useState(!!freshResult);

  useEffect(() => {
    const s = updateStreak(status === "won");
    setStreak(s);
  }, [status]);

  const won = status === "won";
  const scoreLabel = won ? getScoreLabel(guesses.length, par) : null;

  async function handleShare() {
    const text = generateShareText(puzzleNumber, guesses, totalReviews, par, status);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  if (!answer) return null;

  return (
    <>
      {/* inline results */}
      <div className="border border-lbx-border bg-lbx-surface">
        <div className="flex items-stretch gap-2.5">
          {answer.poster_url && (
            <img
              src={`https://image.tmdb.org/t/p/w200${answer.poster_url}`}
              alt={answer.title}
              className="w-16 shrink-0 self-start"
            />
          )}
          <div className="flex-1 min-w-0 py-2">
            <div className="text-sm font-semibold text-foreground leading-tight truncate">
              {answer.title}{answer.year && <span className="font-normal text-lbx-muted ml-1">({answer.year})</span>}
            </div>
            {answer.genres && answer.genres.length > 0 && (
              <div className="text-[10px] text-lbx-muted truncate">{answer.genres.join(" / ")}</div>
            )}
            {answer.director && (
              <div className="text-[10px] text-foreground/70">{answer.director}</div>
            )}
            {answer.cast_members && answer.cast_members.length > 0 && (
              <div className="text-[10px] text-foreground/50 truncate">{answer.cast_members.join(", ")}</div>
            )}
            {answer.studio && (
              <div className="text-[10px] text-lbx-muted/60">{answer.studio}</div>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-end justify-center gap-1.5 py-2 pr-3">
            <div className={`text-[9px] uppercase tracking-wide ${won ? "text-lbx-green" : "text-lbx-orange"}`}>
              {won ? "you got it!" : "better luck next time"}
            </div>
            <div className={`text-xs font-bold ${won ? "text-lbx-green" : "text-red-400"}`}>
              {won ? scoreLabel : getScoreLabel(totalReviews + 1, par)}
            </div>
            <div className="text-[9px] text-lbx-body text-right">
              {won ? guesses.length : totalReviews}/{totalReviews} &middot; par {par}
            </div>
            <button
              onClick={handleShare}
              className="border border-lbx-green text-lbx-green px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] font-semibold transition-all hover:bg-lbx-green hover:text-background active:scale-[0.97]"
            >
              {copied ? "copied" : "share"}
            </button>
          </div>
        </div>
      </div>

      {/* modal overlay — only on fresh result */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-background/80 z-40 animate-fade-in"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div
              className="bg-lbx-surface border border-lbx-border w-full max-w-[240px] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2.5 right-3 text-lbx-body hover:text-foreground text-xs transition-colors z-10"
              >
                &times;
              </button>
              <ResultContent
                answer={answer}
                won={won}
                scoreLabel={scoreLabel}
                guesses={guesses}
                totalReviews={totalReviews}
                par={par}
                streak={streak}
                copied={copied}
                onShare={handleShare}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
