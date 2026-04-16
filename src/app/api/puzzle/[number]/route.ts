import { NextRequest, NextResponse } from "next/server";
import { getPuzzleByNumber, getTotalPuzzleCount } from "@/lib/supabase";
import { TEST_PUZZLE } from "@/lib/test-data";
import { getTodayET } from "@/lib/date";
import type { DailyResponse } from "@/types";

const useSupabase = process.env.SUPABASE_URL !== "your_supabase_url";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  const { number } = await params;
  const puzzleNumber = parseInt(number);
  if (isNaN(puzzleNumber)) {
    return NextResponse.json({ error: "invalid puzzle number" }, { status: 400 });
  }

  if (!useSupabase) {
    const { answer: _, ...rest } = TEST_PUZZLE;
    return NextResponse.json({ ...rest, totalPuzzles: 1 });
  }

  const data = await getPuzzleByNumber(puzzleNumber);
  if (!data) {
    return NextResponse.json({ error: "puzzle not found" }, { status: 404 });
  }

  // don't serve future puzzles
  const today = getTodayET();
  if (data.puzzleDate > today) {
    return NextResponse.json({ error: "puzzle not found" }, { status: 404 });
  }

  const total = await getTotalPuzzleCount();

  const puzzle: DailyResponse & { totalPuzzles: number } = {
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
    totalPuzzles: total,
  };

  return NextResponse.json(puzzle);
}
