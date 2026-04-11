import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET all movies in the pool
export async function GET() {
  const { data, error } = await supabase
    .from("movies")
    .select("*")
    .order("title", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
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
