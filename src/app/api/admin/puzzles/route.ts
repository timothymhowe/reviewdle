import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

async function renumberPuzzles() {
  await supabase.rpc("renumber_puzzles");
}

// GET all scheduled puzzles
export async function GET() {
  const { data, error } = await supabase
    .from("daily_puzzles")
    .select(`
      id,
      puzzle_date,
      puzzle_number,
      movie:movies (
        id,
        title,
        year,
        poster_url,
        difficulty,
        par
      )
    `)
    .order("puzzle_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST schedule a new puzzle
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { movie_id, puzzle_date } = body;

  // get next number (always unique, then renumber fixes order)
  const { count } = await supabase
    .from("daily_puzzles")
    .select("id", { count: "exact", head: true });

  const { error } = await supabase
    .from("daily_puzzles")
    .insert({ movie_id, puzzle_date, puzzle_number: (count || 0) + 1 });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await renumberPuzzles();

  return NextResponse.json({ ok: true });
}

// DELETE a scheduled puzzle
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await supabase.from("daily_puzzles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await renumberPuzzles();

  return NextResponse.json({ ok: true });
}
