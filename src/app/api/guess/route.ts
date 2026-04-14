import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromCookies, setUserCookie } from "@/lib/user";
import { getMovieByPuzzleId } from "@/lib/supabase";
import { TEST_PUZZLE } from "@/lib/test-data";
import type { GuessResponse } from "@/types";

const useSupabase = process.env.SUPABASE_URL !== "your_supabase_url";

export async function POST(request: NextRequest) {
  const { userId, isNew } = getUserIdFromCookies(
    request.headers.get("cookie")
  );
  const body = await request.json();
  const { tmdbId, reveal, puzzleId } = body as {
    tmdbId: number;
    reveal?: boolean;
    puzzleId?: string;
  };

  let answer: {
    tmdb_id: number;
    title: string;
    year: number | null;
    poster_url: string | null;
    director: string | null;
    cast_members: string[] | null;
    genres: string[] | null;
    studio: string | null;
    letterboxd_url: string | null;
  };

  if (useSupabase && puzzleId) {
    const movie = await getMovieByPuzzleId(puzzleId);
    if (!movie) {
      return NextResponse.json({ error: "puzzle not found" }, { status: 404 });
    }
    answer = movie;
  } else {
    answer = TEST_PUZZLE.answer;
  }

  if (reveal) {
    const response = NextResponse.json({
      correct: false,
      gameOver: true,
      answer,
    } satisfies GuessResponse);
    setUserCookie(response.headers, userId, isNew);
    return response;
  }

  const correct = tmdbId === answer.tmdb_id;

  const res: GuessResponse = {
    correct,
    gameOver: correct,
    ...(correct && { answer }),
  };

  const response = NextResponse.json(res);
  setUserCookie(response.headers, userId, isNew);
  return response;
}
