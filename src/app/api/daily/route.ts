import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromCookies, setUserCookie } from "@/lib/user";
import { getTodaysPuzzle } from "@/lib/supabase";
import { TEST_PUZZLE } from "@/lib/test-data";
import type { DailyResponse } from "@/types";

const useSupabase = process.env.SUPABASE_URL !== "your_supabase_url";

export async function GET(request: NextRequest) {
  const { userId, isNew } = getUserIdFromCookies(
    request.headers.get("cookie")
  );

  let puzzle: DailyResponse;

  if (useSupabase) {
    const data = await getTodaysPuzzle();
    if (!data) {
      return NextResponse.json(
        { error: "no puzzle today" },
        { status: 404 }
      );
    }
    puzzle = {
      puzzleId: data.puzzleId,
      puzzleNumber: data.puzzleNumber,
      par: data.movie.par,
      difficulty: data.movie.difficulty as "easy" | "medium" | "hard",
      totalReviews: data.reviews.length,
      reviews: data.reviews.map((r) => ({
        text: r.review_text,
        stars: r.stars ?? null,
        likes: r.likes ?? 0,
        liked: r.liked ?? false,
        review_date: r.review_date ?? null,
        reviewer_name: r.reviewer_name,
        reviewer_avatar_url: r.reviewer_avatar_url,
        reviewer_profile_url: r.reviewer_profile_url,
        letterboxd_url: r.letterboxd_url ?? null,
      })),
    };
  } else {
    const { answer: _, ...rest } = TEST_PUZZLE;
    puzzle = rest;
  }

  const response = NextResponse.json(puzzle);
  setUserCookie(response.headers, userId, isNew);
  return response;
}
