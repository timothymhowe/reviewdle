import type { TMDBSearchResult } from "@/types";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function searchMovies(
  query: string
): Promise<TMDBSearchResult[]> {
  if (!query || query.length < 2) return [];

  const res = await fetch(
    `${TMDB_BASE}/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.results.slice(0, 10).map((m: Record<string, unknown>) => ({
    id: m.id,
    title: m.title,
    release_date: m.release_date || "",
    poster_path: m.poster_path,
  }));
}
