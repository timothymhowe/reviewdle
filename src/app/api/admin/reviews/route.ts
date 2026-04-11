import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET reviews for a movie
export async function GET(request: NextRequest) {
  const movieId = request.nextUrl.searchParams.get("movieId");
  if (!movieId) return NextResponse.json({ error: "movieId required" }, { status: 400 });

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("movie_id", movieId)
    .order("display_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST save reviews for a movie (replaces all existing)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { movieId, reviews } = body as {
    movieId: string;
    reviews: {
      review_text: string;
      display_order: number;
      stars: number | null;
      likes: number;
      liked: boolean;
      review_date: string;
      reviewer_name: string;
      reviewer_avatar_url: string;
      reviewer_profile_url: string;
      letterboxd_url: string;
    }[];
  };

  // delete existing reviews for this movie
  const { error: delError } = await supabase.from("reviews").delete().eq("movie_id", movieId);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  // insert new ones
  const { data, error } = await supabase
    .from("reviews")
    .insert(reviews.map((r) => ({ ...r, movie_id: movieId })))
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
