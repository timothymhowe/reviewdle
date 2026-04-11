"use client";

import { useState, useEffect, useCallback } from "react";
import type { DailyResponse, Guess, GuessResponse } from "@/types";
import {
  loadGameState,
  saveGameState,
  createInitialState,
  processGuess,
} from "@/lib/game";
import ParBadge from "./ParBadge";
import ReviewCard from "./ReviewCard";
import GuessInput from "./GuessInput";
import ScoreCard from "./ScoreCard";

export default function Game() {
  const [puzzle, setPuzzle] = useState<DailyResponse | null>(null);
  const [gameState, setGameState] = useState<ReturnType<typeof loadGameState>>(
    null
  );
  const [answer, setAnswer] = useState<{
    title: string;
    year: number | null;
    poster_url: string | null;
    director: string | null;
    genres: string[] | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    async function fetchPuzzle() {
      try {
        const res = await fetch("/api/daily");
        if (!res.ok) throw new Error("failed to fetch puzzle");
        const data: DailyResponse = await res.json();
        setPuzzle(data);

        const saved = loadGameState();
        if (saved && saved.puzzleId === data.puzzleId) {
          setGameState(saved);
          if (saved.status !== "playing") {
            const lastGuess = saved.guesses[saved.guesses.length - 1];
            if (saved.status === "won" && lastGuess) {
              const guessRes = await fetch("/api/guess", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tmdbId: lastGuess.tmdb_id, puzzleId: data.puzzleId }),
              });
              const guessData: GuessResponse = await guessRes.json();
              if (guessData.answer) setAnswer(guessData.answer);
            } else if (saved.status === "lost") {
              const revealRes = await fetch("/api/guess", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tmdbId: -1, reveal: true, puzzleId: data.puzzleId }),
              });
              const revealData: GuessResponse = await revealRes.json();
              if (revealData.answer) setAnswer(revealData.answer);
            }
          }
        } else {
          const initial = createInitialState(data.puzzleId, data.totalReviews);
          setGameState(initial);
          saveGameState(initial);
        }
      } catch {
        setError("couldn't load today's puzzle.");
      } finally {
        setLoading(false);
      }
    }
    fetchPuzzle();
  }, []);

  const handleGuess = useCallback(
    async (tmdbId: number, title: string) => {
      if (!puzzle || !gameState || gameState.status !== "playing") return;

      try {
        const res = await fetch("/api/guess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId, puzzleId: puzzle.puzzleId }),
        });
        const data: GuessResponse = await res.json();

        const guess: Guess = {
          tmdb_id: tmdbId,
          title,
          correct: data.correct,
        };
        const newState = processGuess(gameState, guess, puzzle.totalReviews);
        setGameState(newState);
        saveGameState(newState);

        if (data.answer) setAnswer(data.answer);

        if (!data.correct && newState.status === "playing") {
          setShaking(true);
          setTimeout(() => setShaking(false), 400);
        }

        if (!data.correct && newState.status === "lost") {
          const answerRes = await fetch("/api/guess", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tmdbId: -1, reveal: true, puzzleId: puzzle.puzzleId }),
          });
          const answerData: GuessResponse = await answerRes.json();
          if (answerData.answer) setAnswer(answerData.answer);
        }
      } catch {
        setError("something went wrong.");
      }
    },
    [puzzle, gameState]
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="text-lbx-body text-xs tracking-wide animate-pulse">
          loading
        </div>
      </div>
    );
  }

  if (error || !puzzle || !gameState) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="text-red-500 text-xs">{error || "error"}</div>
      </div>
    );
  }

  const visibleReviews = puzzle.reviews.slice(
    0,
    gameState.currentReviewIndex + 1
  );
  const isGameOver = gameState.status !== "playing";

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <ParBadge difficulty={puzzle.difficulty} par={puzzle.par} />
        <span className="text-[10px] text-lbx-body tracking-[0.15em] font-mono">
          #{String(puzzle.puzzleNumber).padStart(3, "0")}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        {visibleReviews.map((review, i) => (
          <ReviewCard
            key={i}
            review={review}
            reviewNumber={i + 1}
            isLatest={i === visibleReviews.length - 1 && !isGameOver}
          />
        ))}
      </div>

      {gameState.guesses.length > 0 && !isGameOver && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-lbx-body">
          {gameState.guesses.map((guess, i) => (
            <span key={i} className="line-through decoration-red-500/50">
              {guess.title}
            </span>
          ))}
        </div>
      )}

      <div className={shaking ? "animate-shake" : ""}>
        <GuessInput onGuess={handleGuess} disabled={isGameOver} />
      </div>

      {!isGameOver && (
        <div className="text-[10px] text-lbx-body tracking-wide font-mono">
          {gameState.currentReviewIndex + 1} / {puzzle.totalReviews}
        </div>
      )}

      {isGameOver && (
        <ScoreCard
          status={gameState.status}
          guesses={gameState.guesses}
          totalReviews={puzzle.totalReviews}
          par={puzzle.par}
          puzzleNumber={puzzle.puzzleNumber}
          answer={answer}
        />
      )}
    </div>
  );
}
