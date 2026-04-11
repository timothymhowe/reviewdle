import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getTodaysPuzzle() {
  const today = new Date().toISOString().split("T")[0];

  const { data: puzzle, error } = await supabase
    .from("daily_puzzles")
    .select(
      `
      id,
      puzzle_date,
      puzzle_number,
      movie:movies (
        id,
        tmdb_id,
        title,
        year,
        poster_url,
        backdrop_url,
        difficulty,
        par,
        director,
        genres,
        runtime_minutes
      )
    `
    )
    .eq("puzzle_date", today)
    .single();

  if (error || !puzzle) return null;

  const movie = puzzle.movie as unknown as {
    id: string;
    tmdb_id: number;
    title: string;
    year: number | null;
    poster_url: string | null;
    backdrop_url: string | null;
    difficulty: string;
    par: number;
    director: string | null;
    genres: string[] | null;
    runtime_minutes: number | null;
  };

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, review_text, display_order, stars, likes, liked, review_date, reviewer_name, reviewer_avatar_url, reviewer_profile_url, letterboxd_url")
    .eq("movie_id", movie.id)
    .order("display_order", { ascending: true });

  return {
    puzzleId: puzzle.id,
    puzzleNumber: puzzle.puzzle_number as number,
    movie,
    reviews: reviews || [],
  };
}

export async function getMovieByPuzzleId(puzzleId: string) {
  const { data: puzzle } = await supabase
    .from("daily_puzzles")
    .select(
      `
      movie:movies (
        tmdb_id,
        title,
        year,
        poster_url,
        director,
        genres
      )
    `
    )
    .eq("id", puzzleId)
    .single();

  if (!puzzle) return null;
  return puzzle.movie as unknown as {
    tmdb_id: number;
    title: string;
    year: number | null;
    poster_url: string | null;
    director: string | null;
    genres: string[] | null;
  };
}

export async function upsertAnonymousUser(cookieId: string) {
  const { data } = await supabase
    .from("users")
    .upsert(
      { cookie_id: cookieId, is_anonymous: true },
      { onConflict: "cookie_id" }
    )
    .select("id")
    .single();

  return data?.id || null;
}

export async function saveGameResult(
  userId: string,
  puzzleId: string,
  guesses: { tmdb_id: number; title: string; correct: boolean }[],
  won: boolean
) {
  await supabase.from("game_results").upsert(
    {
      user_id: userId,
      puzzle_id: puzzleId,
      guesses,
      num_guesses: guesses.length,
      won,
    },
    { onConflict: "user_id,puzzle_id" }
  );
}
