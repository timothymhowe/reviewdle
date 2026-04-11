import type { GameState, Guess, GameStatus } from "@/types";

const STORAGE_KEY = "reviewdle-state";
const STREAK_KEY = "reviewdle-streak";

export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export function loadGameState(): GameState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const state: GameState = JSON.parse(raw);
    if (state.date !== getTodayDateString()) return null;
    return state;
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createInitialState(
  puzzleId: string,
  totalReviews: number
): GameState {
  return {
    date: getTodayDateString(),
    puzzleId,
    currentReviewIndex: 0,
    guesses: [],
    status: "playing",
  };
}

export function processGuess(
  state: GameState,
  guess: Guess,
  totalReviews: number
): GameState {
  const guesses = [...state.guesses, guess];

  if (guess.correct) {
    return { ...state, guesses, status: "won" };
  }

  const nextIndex = state.currentReviewIndex + 1;
  if (nextIndex >= totalReviews) {
    return { ...state, guesses, status: "lost", currentReviewIndex: nextIndex };
  }

  return { ...state, guesses, status: "playing", currentReviewIndex: nextIndex };
}

export function getScoreLabel(guessCount: number, par: number): string {
  const diff = guessCount - par;
  if (diff <= -2) return "eagle";
  if (diff === -1) return "birdie";
  if (diff === 0) return "par";
  if (diff === 1) return "bogey";
  if (diff === 2) return "double bogey";
  return "triple bogey+";
}

export function generateShareText(
  puzzleNumber: number,
  guesses: Guess[],
  totalReviews: number,
  par: number,
  status: GameStatus
): string {
  const squares = Array.from({ length: totalReviews }, (_, i) => {
    if (i >= guesses.length) return "\u2B1C";
    return guesses[i].correct ? "\uD83D\uDFE9" : "\uD83D\uDFE5";
  }).join(" ");

  const result =
    status === "won"
      ? `${guesses.length}/${totalReviews} (par ${par} \u2014 ${getScoreLabel(guesses.length, par)})`
      : `X/${totalReviews} (par ${par})`;

  return `\uD83C\uDFAC Reviewdle #${puzzleNumber} \u26F3\n${squares}\n${result}`;
}

export function loadStreak(): { current: number; max: number; lastDate: string | null } {
  if (typeof window === "undefined") return { current: 0, max: 0, lastDate: null };
  const raw = localStorage.getItem(STREAK_KEY);
  if (!raw) return { current: 0, max: 0, lastDate: null };
  try {
    return JSON.parse(raw);
  } catch {
    return { current: 0, max: 0, lastDate: null };
  }
}

export function updateStreak(won: boolean): { current: number; max: number } {
  const streak = loadStreak();
  const today = getTodayDateString();

  if (streak.lastDate === today) return streak;

  if (won) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const newCurrent = streak.lastDate === yesterdayStr ? streak.current + 1 : 1;
    const newMax = Math.max(newCurrent, streak.max);
    const updated = { current: newCurrent, max: newMax, lastDate: today };
    localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
  } else {
    const updated = { current: 0, max: streak.max, lastDate: today };
    localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    return updated;
  }
}
