import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all movies with review count and schedule info
export async function GET() {
  const { data: movies, error } = await supabase
    .from("movies")
    .select("*")
    .order("title", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // get review counts per movie
  const { data: reviewCounts } = await supabase
    .from("reviews")
    .select("movie_id");

  const countMap: Record<string, number> = {};
  for (const r of reviewCounts || []) {
    countMap[r.movie_id] = (countMap[r.movie_id] || 0) + 1;
  }

  // get schedule info per movie
  const { data: schedules } = await supabase
    .from("daily_puzzles")
    .select("movie_id, puzzle_date, puzzle_number")
    .order("puzzle_date", { ascending: true });

  const scheduleMap: Record<string, { puzzle_date: string; puzzle_number: number }> = {};
  for (const s of schedules || []) {
    scheduleMap[s.movie_id] = {
      puzzle_date: s.puzzle_date as string,
      puzzle_number: s.puzzle_number as number,
    };
  }

  const today = new Date().toISOString().split("T")[0];

  const enriched = (movies || []).map((m) => ({
    ...m,
    review_count: countMap[m.id] || 0,
    schedule: scheduleMap[m.id] || null,
    played: scheduleMap[m.id] ? scheduleMap[m.id].puzzle_date < today : false,
  }));

  return NextResponse.json(enriched);
}

// POST add a movie from TMDB data
export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    tmdb_id,
    title,
    year,
    poster_url,
    backdrop_url,
    difficulty,
    par,
    vote_count,
    director,
    cast: castMembers,
    genres,
    runtime_minutes,
    tagline,
    overview,
    imdb_id,
  } = body;

  const { data, error } = await supabase
    .from("movies")
    .upsert(
      {
        tmdb_id,
        title,
        year,
        poster_url,
        backdrop_url,
        difficulty,
        par,
        vote_count,
        director,
        cast_members: castMembers || [],
        genres,
        runtime_minutes,
        tagline,
        overview,
        imdb_id,
      },
      { onConflict: "tmdb_id" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
