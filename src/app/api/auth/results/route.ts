import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ results: [] });

  const token = authHeader.replace("Bearer ", "");
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) return NextResponse.json({ results: [] });

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!dbUser) return NextResponse.json({ results: [] });

  const { data: results } = await supabase
    .from("game_results")
    .select("puzzle_id, guesses, num_guesses, won")
    .eq("user_id", dbUser.id);

  return NextResponse.json({ results: results || [] });
}
