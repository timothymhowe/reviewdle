/**
 * backfill cast_members + studio for existing movies in the db
 * run: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/backfill-cast.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const TMDB_BASE = "https://api.themoviedb.org/3";

async function main() {
  const { data: movies, error } = await supabase
    .from("movies")
    .select("id, tmdb_id, title, cast_members, studio")
    .order("title");

  if (error || !movies) {
    console.error("failed to fetch movies:", error);
    return;
  }

  console.log(`found ${movies.length} movies\n`);

  for (const movie of movies) {
    const needsCast = !movie.cast_members || movie.cast_members.length === 0;
    const needsStudio = !movie.studio;

    if (!needsCast && !needsStudio) {
      console.log(`skip: ${movie.title} (complete)`);
      continue;
    }

    const [creditsRes, detailsRes] = await Promise.all([
      needsCast
        ? fetch(`${TMDB_BASE}/movie/${movie.tmdb_id}/credits?api_key=${TMDB_API_KEY}&language=en-US`)
        : null,
      needsStudio
        ? fetch(`${TMDB_BASE}/movie/${movie.tmdb_id}?api_key=${TMDB_API_KEY}&language=en-US`)
        : null,
    ]);

    const updates: Record<string, unknown> = {};

    if (creditsRes?.ok) {
      const credits = await creditsRes.json();
      updates.cast_members = (credits.cast || [])
        .slice(0, 3)
        .map((c: { name: string }) => c.name);
    }

    if (detailsRes?.ok) {
      const details = await detailsRes.json();
      updates.studio = details.production_companies?.[0]?.name || null;
    }

    if (Object.keys(updates).length === 0) {
      console.log(`fail: ${movie.title} (tmdb error)`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("movies")
      .update(updates)
      .eq("id", movie.id);

    if (updateErr) {
      console.log(`fail: ${movie.title} (db error: ${updateErr.message})`);
    } else {
      const cast = (updates.cast_members as string[])?.join(", ") || "—";
      const studio = (updates.studio as string) || "—";
      console.log(`done: ${movie.title} → cast: ${cast} | studio: ${studio}`);
    }
  }

  console.log("\nbackfill complete");
}

main();
