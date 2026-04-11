import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY!;

// GET full movie details from TMDB by id
export async function GET(request: NextRequest) {
  const tmdbId = request.nextUrl.searchParams.get("id");
  if (!tmdbId) return NextResponse.json({ error: "id required" }, { status: 400 });

  const [movieRes, creditsRes] = await Promise.all([
    fetch(`${TMDB_BASE}/movie/${tmdbId}?api_key=${API_KEY}&language=en-US`),
    fetch(`${TMDB_BASE}/movie/${tmdbId}/credits?api_key=${API_KEY}&language=en-US`),
  ]);

  if (!movieRes.ok) {
    return NextResponse.json({ error: "movie not found" }, { status: 404 });
  }

  const movie = await movieRes.json();
  const credits = creditsRes.ok ? await creditsRes.json() : { crew: [] };

  const director = credits.crew?.find(
    (c: { job: string; name: string }) => c.job === "Director"
  )?.name || null;

  return NextResponse.json({
    tmdb_id: movie.id,
    title: movie.title,
    year: movie.release_date ? parseInt(movie.release_date.split("-")[0]) : null,
    poster_url: movie.poster_path,
    backdrop_url: movie.backdrop_path,
    vote_count: movie.vote_count,
    director,
    genres: movie.genres?.map((g: { name: string }) => g.name) || [],
    runtime_minutes: movie.runtime,
    tagline: movie.tagline || null,
    overview: movie.overview || null,
    imdb_id: movie.imdb_id || null,
  });
}
