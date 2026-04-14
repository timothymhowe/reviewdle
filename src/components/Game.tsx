"use client";

import { useState, useEffect, useCallback } from "react";
import type { DailyResponse, Guess, GuessResponse, ReviewClue } from "@/types";
import PuzzleNav from "./PuzzleNav";
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

interface GameProps {
  puzzleNumber: number;
}

export default function Game({ puzzleNumber }: GameProps) {
  const [puzzle, setPuzzle] = useState<DailyResponse | null>(null);
  const [gameState, setGameState] = useState<ReturnType<typeof loadGameState>>(null);
  const [answer, setAnswer] = useState<{
    title: string;
    year: number | null;
    poster_url: string | null;
    director: string | null;
    cast_members: string[] | null;
    genres: string[] | null;
    studio: string | null;
    letterboxd_url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [freshResult, setFreshResult] = useState(false);

  useEffect(() => {
    async function fetchPuzzle() {
      setLoading(true);
      setError(null);
      setPuzzle(null);
      setGameState(null);
      setAnswer(null);

      try {
        const res = await fetch(`/api/puzzle/${puzzleNumber}`);
        if (!res.ok) throw new Error("puzzle not found");
        const data = await res.json();
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
        setError("puzzle not found");
      } finally {
        setLoading(false);
      }
    }
    fetchPuzzle();
  }, [puzzleNumber]);

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

        const guess: Guess = { tmdb_id: tmdbId, title, correct: data.correct };
        const newState = processGuess(gameState, guess, puzzle.totalReviews);
        setGameState(newState);
        saveGameState(newState);

        if (data.answer) {
          setAnswer(data.answer);
          setFreshResult(true);
        }

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
          if (answerData.answer) {
            setAnswer(answerData.answer);
            setFreshResult(true);
          }
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
        <div className="text-lbx-body text-xs tracking-wide animate-pulse">loading</div>
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

  const visibleReviews = puzzle.reviews.slice(0, gameState.currentReviewIndex + 1);
  const isGameOver = gameState.status !== "playing";

  const allReviews = puzzle.reviews;
  const seenCount = gameState.currentReviewIndex + 1;

  const displayReviews: ReviewClue[] = isGameOver
    ? allReviews
    : allReviews.slice(0, seenCount);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center gap-4">
        <PuzzleNav puzzleNumber={puzzleNumber} />
        <ParBadge difficulty={puzzle.difficulty} par={puzzle.par} />
      </div>

      {isGameOver && (
        <ScoreCard
          status={gameState.status}
          guesses={gameState.guesses}
          totalReviews={puzzle.totalReviews}
          par={puzzle.par}
          puzzleNumber={puzzleNumber}
          answer={answer}
          freshResult={freshResult}
        />
      )}

      <div className="flex flex-col gap-0">
        {displayReviews.map((review, i) => (
          <ReviewCard
            key={i}
            review={review}
            reviewNumber={i + 1}
            isLatest={i === seenCount - 1 && !isGameOver}
            unseen={isGameOver && i >= seenCount}
            gameOver={isGameOver}
          />
        ))}
      </div>

      {gameState.guesses.length > 0 && !isGameOver && (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-lbx-muted">
          {gameState.guesses.map((guess, i) => (
            <span key={i} className="line-through decoration-red-500/60">
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

    </div>
  );
}
