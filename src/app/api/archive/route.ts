import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("daily_puzzles")
    .select(`
      id,
      puzzle_date,
      puzzle_number,
      movie:movies (
        title,
        year,
        poster_url,
        difficulty,
        par
      )
    `)
    .lte("puzzle_date", today)
    .order("puzzle_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
