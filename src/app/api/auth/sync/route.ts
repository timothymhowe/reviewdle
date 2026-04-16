import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  // verify the user
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // get the user's id from our users table
  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!dbUser) return NextResponse.json({ error: "user not found" }, { status: 404 });

  // receive game states from client
  const { gameStates } = await request.json() as {
    gameStates: {
      puzzleId: string;
      guesses: { tmdb_id: number; title: string; correct: boolean }[];
      status: "won" | "lost";
    }[];
  };

  let synced = 0;
  for (const state of gameStates) {
    if (state.status !== "won" && state.status !== "lost") continue;

    // check if puzzle exists
    const { data: puzzle } = await supabase
      .from("daily_puzzles")
      .select("id")
      .eq("id", state.puzzleId)
      .single();

    if (!puzzle) continue;

    const { error: upsertErr } = await supabase
      .from("game_results")
      .upsert(
        {
          user_id: dbUser.id,
          puzzle_id: state.puzzleId,
          guesses: state.guesses,
          num_guesses: state.guesses.length,
          won: state.status === "won",
        },
        { onConflict: "user_id,puzzle_id" }
      );

    if (!upsertErr) synced++;
  }

  return NextResponse.json({ synced });
}
