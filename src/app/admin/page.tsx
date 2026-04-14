"use client";

import { useState, useEffect, useCallback } from "react";
import type { TMDBSearchResult } from "@/types";

interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_url: string | null;
  difficulty: string;
  par: number;
  vote_count: number | null;
  director: string | null;
  genres: string[] | null;
  review_count: number;
  schedule: { puzzle_date: string; puzzle_number: number } | null;
  played: boolean;
}

interface ReviewRow {
  review_text: string;
  stars: number | null;
  likes: number;
  liked: boolean;
  review_date: string;
  reviewer_name: string;
  reviewer_avatar_url: string;
  reviewer_profile_url: string;
  letterboxd_url: string;
}

interface Puzzle {
  id: string;
  puzzle_date: string;
  puzzle_number: number;
  movie: { id: string; title: string; year: number | null; poster_url: string | null; difficulty: string; par: number } | null;
}

export default function AdminPage() {
  const [tab, setTab] = useState<"movies" | "reviews" | "schedule">("movies");
  const [jumpToMovieId, setJumpToMovieId] = useState<string | null>(null);

  function goToReview(movieId: string) {
    setJumpToMovieId(movieId);
    setTab("reviews");
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-lbx-border">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-baseline justify-between">
          <a href="/" className="text-2xl font-bold tracking-tight text-white lowercase font-sans flex items-center gap-2 no-underline">
            <svg width="56" height="28" viewBox="0 0 44 22" className="shrink-0">
              <defs>
                <clipPath id="c1"><rect width="12" height="12" transform="translate(7,11) rotate(-45)" /></clipPath>
                <clipPath id="c3"><rect width="12" height="12" transform="translate(25,11) rotate(-45)" /></clipPath>
              </defs>
              <rect width="12" height="12" transform="translate(7,11) rotate(-45)" fill="#40bcf4" />
              <rect width="12" height="12" transform="translate(16,11) rotate(-45)" fill="#00e054" />
              <rect width="12" height="12" transform="translate(25,11) rotate(-45)" fill="#ee7000" />
              <g clipPath="url(#c1)">
                <rect width="12" height="12" transform="translate(16,11) rotate(-45)" fill="white" />
              </g>
              <g clipPath="url(#c3)">
                <rect width="12" height="12" transform="translate(16,11) rotate(-45)" fill="white" />
              </g>
            </svg>
            reviewdle
          </a>
          <span className="text-[10px] uppercase tracking-[0.15em] text-lbx-body">
            admin
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <nav className="flex gap-6 border-b border-lbx-border mb-8">
          {(["movies", "reviews", "schedule"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-xs uppercase tracking-[0.15em] font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-lbx-green text-foreground"
                  : "border-transparent text-lbx-body hover:text-lbx-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>

        {tab === "movies" && <MoviesTab onGoToReview={goToReview} />}
        {tab === "reviews" && <ReviewsTab jumpToMovieId={jumpToMovieId} onJumpHandled={() => setJumpToMovieId(null)} />}
        {tab === "schedule" && <ScheduleTab />}
      </div>
    </div>
  );
}

// ─── MOVIES TAB ──────────────────────────────────────────────

function MoviesTab({ onGoToReview }: { onGoToReview: (movieId: string) => void }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBSearchResult[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Movie | null>(null);
  const [showPlayed, setShowPlayed] = useState(false);
  const [showUnreviewed, setShowUnreviewed] = useState(true);
  const [showReviewed, setShowReviewed] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  async function fetchMovies() {
    const res = await fetch("/api/admin/movies");
    if (res.ok) setMovies(await res.json());
  }

  const searchTMDB = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (res.ok) setSearchResults(await res.json());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchTMDB(query), 300);
    return () => clearTimeout(t);
  }, [query, searchTMDB]);

  async function addMovie(tmdbId: number) {
    setAdding(true);
    setMessage("");
    try {
      const detailRes = await fetch(`/api/admin/tmdb?id=${tmdbId}`);
      if (!detailRes.ok) { setMessage("tmdb lookup failed"); return; }
      const details = await detailRes.json();

      let difficulty = "hard";
      let par = 5;
      if (details.vote_count >= 10000) { difficulty = "easy"; par = 3; }
      else if (details.vote_count >= 5000) { difficulty = "medium"; par = 4; }

      const saveRes = await fetch("/api/admin/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, difficulty, par }),
      });

      if (saveRes.ok) {
        setMessage(`added: ${details.title}`);
        setQuery("");
        setSearchResults([]);
        fetchMovies();
      } else {
        const err = await saveRes.json();
        setMessage(err.error || "save failed");
      }
    } finally {
      setAdding(false);
    }
  }

  // sort: scheduled movies by date first, then unscheduled
  const sorted = [...movies].sort((a, b) => {
    if (a.schedule && b.schedule) return a.schedule.puzzle_date.localeCompare(b.schedule.puzzle_date);
    if (a.schedule) return -1;
    if (b.schedule) return 1;
    return a.title.localeCompare(b.title);
  });

  const filtered = sorted.filter((m) => {
    if (m.played && !showPlayed) return false;
    if (m.review_count === 0 && !showUnreviewed) return false;
    if (m.review_count > 0 && !showReviewed) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-[10px] uppercase tracking-[0.15em] text-lbx-body block mb-2">
          search tmdb
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="movie title"
          className="w-full bg-transparent border-b border-lbx-border px-0 py-2 text-sm text-foreground placeholder-lbx-body/40 outline-none focus:border-lbx-green"
        />
        {searchResults.length > 0 && (
          <ul className="border border-lbx-border bg-lbx-surface mt-1 max-h-72 overflow-auto">
            {searchResults.map((r) => {
              const year = r.release_date?.split("-")[0] || "";
              const alreadyAdded = movies.some((m) => m.tmdb_id === r.id);
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 px-3 py-2 border-b border-lbx-border/50 last:border-b-0"
                >
                  {r.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt="" className="h-12 w-8 object-cover shrink-0" />
                  ) : (
                    <div className="h-12 w-8 bg-lbx-border/50 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    {year && <div className="text-[11px] text-lbx-body">{year}</div>}
                  </div>
                  <button
                    onClick={() => addMovie(r.id)}
                    disabled={adding || alreadyAdded}
                    className={`text-[10px] uppercase tracking-wider font-semibold px-3 py-1 border transition-colors ${
                      alreadyAdded
                        ? "border-lbx-border text-lbx-body cursor-default"
                        : "border-lbx-green text-lbx-green hover:bg-lbx-green hover:text-background"
                    }`}
                  >
                    {alreadyAdded ? "added" : "add"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {message && <div className="mt-2 text-xs text-lbx-green">{message}</div>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] uppercase tracking-[0.15em] text-lbx-body">
            movie pool ({filtered.length}/{movies.length})
          </div>
          <div className="flex items-center gap-3">
            {[
              { label: "played", state: showPlayed, set: setShowPlayed },
              { label: "reviewed", state: showReviewed, set: setShowReviewed },
              { label: "unreviewed", state: showUnreviewed, set: setShowUnreviewed },
            ].map(({ label, state, set }) => (
              <button
                key={label}
                onClick={() => set(!state)}
                className={`text-[10px] uppercase tracking-wider transition-colors ${
                  state ? "text-foreground" : "text-lbx-body/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-3 py-2 border-b border-lbx-border/50 ${m.played ? "opacity-35" : ""}`}
            >
              {m.poster_url ? (
                <img src={`https://image.tmdb.org/t/p/w92${m.poster_url}`} alt="" className="h-10 w-7 object-cover shrink-0" />
              ) : (
                <div className="h-10 w-7 bg-lbx-border/50 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{m.title}</span>
                {m.year && <span className="text-lbx-body text-xs ml-2">{m.year}</span>}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-lbx-body">
                <button
                  onClick={() => onGoToReview(m.id)}
                  className={`hover:text-lbx-green transition-colors ${m.review_count > 0 ? "text-lbx-green" : ""}`}
                >
                  {m.review_count}&nbsp;reviews &rarr;
                </button>
                {m.schedule ? (
                  <span className="font-mono">
                    #{String(m.schedule.puzzle_number).padStart(3, "0")} {m.schedule.puzzle_date}
                  </span>
                ) : (
                  <span className="text-lbx-body/40">unscheduled</span>
                )}
                <button
                  onClick={() => setConfirmDelete(m)}
                  className="text-lbx-body/40 hover:text-red-500 transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-xs text-lbx-body py-4">no movies match filters</div>
          )}
        </div>
      </div>

      {/* delete confirm modal */}
      {confirmDelete && (
        <>
          <div className="fixed inset-0 bg-background/80 z-40" onClick={() => setConfirmDelete(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-lbx-surface border border-lbx-border p-5 max-w-xs w-full flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="text-sm text-foreground">
                delete <span className="font-semibold">{confirmDelete.title}</span>?
              </div>
              <div className="text-[11px] text-lbx-body">
                this will also remove its reviews and any scheduled puzzles.
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="text-[10px] uppercase tracking-wider text-lbx-body hover:text-foreground transition-colors px-3 py-1.5"
                >
                  cancel
                </button>
                <button
                  onClick={async () => {
                    await fetch(`/api/admin/movies/${confirmDelete.id}`, { method: "DELETE" });
                    setConfirmDelete(null);
                    fetchMovies();
                  }}
                  className="text-[10px] uppercase tracking-wider font-semibold px-4 py-1.5 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                >
                  delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── REVIEWS TAB ─────────────────────────────────────────────

function ReviewsTab({ jumpToMovieId, onJumpHandled }: { jumpToMovieId: string | null; onJumpHandled: () => void }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/movies")
      .then((r) => r.json())
      .then((data: Movie[]) => {
        setMovies(data);
        if (jumpToMovieId) {
          const target = data.find((m) => m.id === jumpToMovieId);
          if (target) selectMovie(target);
          onJumpHandled();
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function letterboxdSlug(title: string): string {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  async function selectMovie(movie: Movie) {
    setSelectedMovie(movie);
    setMessage("");
    const res = await fetch(`/api/admin/reviews?movieId=${movie.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        setReviews(
          data.map((r: ReviewRow & { review_text: string }) => ({
            review_text: r.review_text,
            stars: r.stars ?? null,
            likes: r.likes ?? 0,
            liked: r.liked ?? false,
            review_date: r.review_date || "",
            reviewer_name: r.reviewer_name || "",
            reviewer_avatar_url: r.reviewer_avatar_url || "",
            reviewer_profile_url: r.reviewer_profile_url || "",
            letterboxd_url: r.letterboxd_url || "",
          }))
        );
      } else {
        setReviews([]);
      }
    }
  }

  async function scrapeAndAdd() {
    if (!scrapeUrl.trim() || reviews.length >= 6) return;
    setScraping(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });

      if (!res.ok) {
        setMessage("scrape failed");
        return;
      }

      const data = await res.json();
      setReviews((prev) => [
        ...prev,
        {
          review_text: data.review_text,
          stars: data.stars,
          likes: data.likes,
          liked: data.liked,
          review_date: data.review_date || "",
          reviewer_name: data.reviewer_name,
          reviewer_avatar_url: data.reviewer_avatar_url || "",
          reviewer_profile_url: data.reviewer_profile_url || "",
          letterboxd_url: data.letterboxd_url || scrapeUrl,
        },
      ]);
      setScrapeUrl("");
      if (data.partial) {
        setEditingIndex(reviews.length);
        setMessage("partial — fill in text, stars, heart");
      } else {
        setEditingIndex(null);
        setMessage("scraped");
      }
    } catch {
      setMessage("scrape error");
    } finally {
      setScraping(false);
    }
  }

  function updateReview(index: number, field: keyof ReviewRow, value: ReviewRow[keyof ReviewRow]) {
    setReviews((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function removeReview(index: number) {
    setReviews((prev) => prev.filter((_, i) => i !== index));
  }

  function moveReview(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= reviews.length) return;
    setReviews((prev) => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
    if (editingIndex === index) setEditingIndex(newIndex);
    else if (editingIndex === newIndex) setEditingIndex(index);
  }

  async function saveReviews() {
    if (!selectedMovie) return;
    setSaving(true);
    setMessage("");

    const payload = reviews
      .filter((r) => r.review_text.trim())
      .map((r, i) => ({ ...r, display_order: i + 1 }));

    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId: selectedMovie.id, reviews: payload }),
    });

    if (res.ok) setMessage("saved");
    else setMessage("error saving");
    setSaving(false);
  }

  function starsDisplay(stars: number | null): string {
    if (!stars) return "";
    const full = Math.floor(stars);
    const half = stars % 1 >= 0.5;
    return "\u2605".repeat(full) + (half ? "\u00BD" : "");
  }

  return (
    <div className="flex gap-8">
      {/* movie list */}
      <div className="w-52 shrink-0">
        <div className="text-[10px] uppercase tracking-[0.15em] text-lbx-body mb-3">
          editable ({movies.filter((m) => !m.played).length})
        </div>
        <div className="flex flex-col">
          {movies
            .filter((m) => !m.played)
            .sort((a, b) => a.review_count - b.review_count)
            .map((m) => (
              <button
                key={m.id}
                onClick={() => selectMovie(m)}
                className={`text-left px-2 py-1.5 text-sm transition-colors border-l-2 flex items-center justify-between ${
                  selectedMovie?.id === m.id
                    ? "border-l-lbx-green text-foreground"
                    : "border-l-transparent text-lbx-muted hover:text-foreground"
                }`}
              >
                <span>
                  {m.title}
                  {m.year && (
                    <span className="text-lbx-body text-[11px] ml-1">{m.year}</span>
                  )}
                </span>
                <span className={`text-[10px] ${
                  m.review_count >= 5 ? "text-lbx-green" : m.review_count > 0 ? "text-lbx-orange" : "text-lbx-body/40"
                }`}>
                  {m.review_count}/5
                </span>
              </button>
            ))}
          {movies.filter((m) => !m.played).length === 0 && (
            <div className="text-xs text-lbx-body">no editable movies</div>
          )}
        </div>
      </div>

      {/* review editor */}
      <div className="flex-1">
        {selectedMovie ? (
          <div className="flex flex-col gap-5">
            {/* header with letterboxd link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-[0.15em] text-lbx-body">
                  {selectedMovie.title} — {reviews.length}/6 reviews
                </span>
                <a
                  href={`https://letterboxd.com/film/${letterboxdSlug(selectedMovie.title)}/reviews/by/activity/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-lbx-blue hover:text-lbx-green transition-colors"
                >
                  browse reviews &rarr;
                </a>
              </div>
              <div className="flex items-center gap-3">
                {message && (
                  <span className="text-xs text-lbx-green">{message}</span>
                )}
                <button
                  onClick={saveReviews}
                  disabled={saving || reviews.length === 0}
                  className="text-[10px] uppercase tracking-wider font-semibold px-4 py-1.5 border border-lbx-green text-lbx-green hover:bg-lbx-green hover:text-background transition-colors disabled:opacity-40"
                >
                  {saving ? "saving" : "save"}
                </button>
              </div>
            </div>

            {/* scrape input */}
            {reviews.length < 6 && (
              <div className="flex gap-2 items-end">
                <input
                  type="text"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && scrapeAndAdd()}
                  placeholder="paste letterboxd review url"
                  className="flex-1 bg-transparent border-b border-lbx-border px-0 py-2 text-sm text-foreground placeholder-lbx-body/40 outline-none focus:border-lbx-green"
                />
                <button
                  onClick={scrapeAndAdd}
                  disabled={scraping || !scrapeUrl.trim()}
                  className="text-[10px] uppercase tracking-wider font-semibold px-4 py-1.5 border border-lbx-green text-lbx-green hover:bg-lbx-green hover:text-background transition-colors disabled:opacity-40"
                >
                  {scraping ? "scraping" : "scrape"}
                </button>
              </div>
            )}

            {/* review list — ordered vague → obvious */}
            <div className="text-[10px] uppercase tracking-[0.15em] text-lbx-body">
              vague &rarr; obvious
            </div>

            {reviews.map((review, i) => {
              const isEditing = editingIndex === i;
              return (
                <div
                  key={i}
                  className={`border-l-2 pl-4 flex flex-col gap-2 ${isEditing ? "border-l-lbx-green" : "border-l-lbx-border"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-lbx-body font-mono">
                        #{i + 1}
                      </span>
                      {review.reviewer_avatar_url && (
                        <img
                          src={review.reviewer_avatar_url}
                          alt=""
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      )}
                      <span className="text-xs text-foreground font-medium">
                        {review.reviewer_name}
                      </span>
                      {isEditing ? (
                        <>
                          <span className="flex items-center gap-px">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                onClick={() => updateReview(i, "stars", review.stars === s ? s - 0.5 : review.stars === s - 0.5 ? (s === 1 ? null : s - 1) : s)}
                                className={`text-sm transition-colors ${
                                  review.stars && review.stars >= s
                                    ? "text-lbx-green"
                                    : review.stars && review.stars >= s - 0.5
                                      ? "text-lbx-green/50"
                                      : "text-lbx-border hover:text-lbx-green/30"
                                }`}
                              >
                                &#9733;
                              </button>
                            ))}
                          </span>
                          <button
                            onClick={() => updateReview(i, "liked", !review.liked)}
                            className={`text-xs transition-colors ${review.liked ? "text-lbx-orange" : "text-lbx-border hover:text-lbx-orange"}`}
                          >
                            &#9829;
                          </button>
                          <input
                            type="text"
                            value={review.likes || ""}
                            onChange={(e) => updateReview(i, "likes", e.target.value === "" ? 0 : parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="w-14 bg-transparent text-[10px] text-lbx-body outline-none border-b border-lbx-border focus:border-lbx-green text-right placeholder-lbx-body/40"
                          />
                          <span className="text-[10px] text-lbx-body">likes</span>
                        </>
                      ) : (
                        <>
                          {review.stars && (
                            <span className="text-xs text-lbx-green">{starsDisplay(review.stars)}</span>
                          )}
                          {review.liked && (
                            <span className="text-xs text-lbx-orange">&#9829;</span>
                          )}
                          {review.likes > 0 && (
                            <span className="text-[10px] text-lbx-body">{review.likes} likes</span>
                          )}
                        </>
                      )}
                    {isEditing ? (
                      <input
                        type="text"
                        value={review.review_date}
                        onChange={(e) => updateReview(i, "review_date", e.target.value)}
                        placeholder="date"
                        className="w-24 bg-transparent text-[10px] text-lbx-body outline-none border-b border-lbx-border focus:border-lbx-green"
                      />
                    ) : (
                      review.review_date && (
                        <span className="text-[10px] text-lbx-body">{review.review_date}</span>
                      )
                    )}
                      {review.letterboxd_url && (
                        <a
                          href={review.letterboxd_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-lbx-blue hover:text-lbx-green"
                        >
                          link
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingIndex(isEditing ? null : i)}
                        className={`text-[10px] uppercase tracking-wider transition-colors ${isEditing ? "text-lbx-green" : "text-lbx-body hover:text-foreground"}`}
                      >
                        {isEditing ? "done" : "edit"}
                      </button>
                      <button
                        onClick={() => moveReview(i, -1)}
                        disabled={i === 0}
                        className="text-lbx-body hover:text-foreground text-xs disabled:opacity-20"
                      >
                        &uarr;
                      </button>
                      <button
                        onClick={() => moveReview(i, 1)}
                        disabled={i === reviews.length - 1}
                        className="text-lbx-body hover:text-foreground text-xs disabled:opacity-20"
                      >
                        &darr;
                      </button>
                      <button
                        onClick={() => removeReview(i)}
                        className="text-lbx-body hover:text-red-500 text-xs ml-2"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                  {isEditing ? (
                    <div>
                      <div className="flex gap-1 mb-1">
                        <button
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand("bold"); }}
                          className="text-[10px] font-bold text-lbx-body hover:text-foreground px-1.5 py-0.5 border border-lbx-border hover:border-lbx-muted transition-colors"
                        >
                          B
                        </button>
                        <button
                          onMouseDown={(e) => { e.preventDefault(); document.execCommand("italic"); }}
                          className="text-[10px] italic text-lbx-body hover:text-foreground px-1.5 py-0.5 border border-lbx-border hover:border-lbx-muted transition-colors"
                        >
                          I
                        </button>
                      </div>
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateReview(i, "review_text", e.currentTarget.innerHTML)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const html = e.clipboardData.getData("text/html");
                          const text = e.clipboardData.getData("text/plain");
                          if (html) {
                            const clean = html.replace(/<(?!\/?(?:em|i|b|strong|br)\b)[^>]+>/gi, "");
                            document.execCommand("insertHTML", false, clean);
                          } else {
                            document.execCommand("insertText", false, text);
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: review.review_text }}
                        className="w-full bg-transparent border border-lbx-border px-3 py-2 text-sm text-lbx-muted font-serif leading-relaxed outline-none focus:border-lbx-green min-h-[3em] [&:empty]:before:content-['review_text'] [&:empty]:before:text-lbx-body/40"
                      />
                    </div>
                  ) : (
                    <div
                      className="text-sm text-lbx-muted font-serif leading-relaxed [&_em]:italic [&_i]:italic [&_b]:font-bold [&_strong]:font-bold"
                      dangerouslySetInnerHTML={{ __html: review.review_text || '<span class="opacity-40 italic">no text — click edit</span>' }}
                    />
                  )}
                </div>
              );
            })}

            {reviews.length === 0 && (
              <div className="text-xs text-lbx-body py-4">
                paste a letterboxd review url above to get started
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-lbx-body py-8">
            select a movie to curate its reviews
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SCHEDULE TAB ────────────────────────────────────────────

function ScheduleTab() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [puzzleDate, setPuzzleDate] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [moviesRes, puzzlesRes] = await Promise.all([
      fetch("/api/admin/movies"),
      fetch("/api/admin/puzzles"),
    ]);
    if (moviesRes.ok) setMovies(await moviesRes.json());
    if (puzzlesRes.ok) {
      const data = await puzzlesRes.json();
      setPuzzles(data);
      // auto-suggest next date (day after last scheduled)
      if (data.length > 0) {
        const lastDate = data[data.length - 1].puzzle_date;
        const next = new Date(lastDate);
        next.setDate(next.getDate() + 1);
        setPuzzleDate(next.toISOString().split("T")[0]);
      } else {
        setPuzzleDate(new Date().toISOString().split("T")[0]);
      }
    }
  }

  async function schedulePuzzle() {
    if (!selectedMovieId || !puzzleDate) return;
    setMessage("");

    const res = await fetch("/api/admin/puzzles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        movie_id: selectedMovieId,
        puzzle_date: puzzleDate,
      }),
    });

    if (res.ok) {
      setMessage("scheduled");
      setSelectedMovieId("");
      fetchAll();
    } else {
      const err = await res.json();
      setMessage(err.error || "failed");
    }
  }

  async function deletePuzzle(id: string) {
    await fetch(`/api/admin/puzzles?id=${id}`, { method: "DELETE" });
    fetchAll();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="text-[10px] uppercase tracking-[0.15em] text-lbx-body">
          schedule puzzle
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-[10px] text-lbx-body block mb-1">movie</label>
            <select
              value={selectedMovieId}
              onChange={(e) => setSelectedMovieId(e.target.value)}
              className="w-full bg-lbx-surface border border-lbx-border px-3 py-2 text-sm text-foreground outline-none focus:border-lbx-green"
            >
              <option value="">select — {movies.filter((m) => m.review_count >= 5 && !m.schedule).length} ready</option>
              {movies.filter((m) => m.review_count >= 5 && !m.schedule).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.year})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-lbx-body block mb-1">date</label>
            <input
              type="date"
              value={puzzleDate}
              onChange={(e) => setPuzzleDate(e.target.value)}
              className="bg-lbx-surface border border-lbx-border px-3 py-2 text-sm text-foreground outline-none focus:border-lbx-green"
            />
          </div>
          <button
            onClick={schedulePuzzle}
            className="text-[10px] uppercase tracking-wider font-semibold px-4 py-2 border border-lbx-green text-lbx-green hover:bg-lbx-green hover:text-background transition-colors h-[38px]"
          >
            schedule
          </button>
        </div>
        {message && (
          <div className="text-xs text-lbx-green">{message}</div>
        )}
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-lbx-body mb-3">
          scheduled puzzles
        </div>
        <div className="flex flex-col">
          {puzzles.map((p) => {
            const movie = p.movie as Puzzle["movie"];
            const isPast = new Date(p.puzzle_date) < new Date(new Date().toDateString());
            return (
              <div
                key={p.id}
                className={`flex items-center gap-4 py-2 border-b border-lbx-border/50 ${isPast ? "opacity-40" : ""}`}
              >
                <span className="text-[11px] font-mono text-lbx-body w-10">
                  #{String(p.puzzle_number).padStart(3, "0")}
                </span>
                <span className="text-xs text-lbx-muted w-24 font-mono">
                  {p.puzzle_date}
                </span>
                <div className="flex-1 text-sm">
                  {movie?.title}
                  {movie?.year && (
                    <span className="text-lbx-body text-xs ml-1">
                      {movie.year}
                    </span>
                  )}
                </div>
                {!isPast && (
                  <button
                    onClick={() => deletePuzzle(p.id)}
                    className="text-[10px] text-lbx-body hover:text-red-500 transition-colors"
                  >
                    remove
                  </button>
                )}
              </div>
            );
          })}
          {puzzles.length === 0 && (
            <div className="text-xs text-lbx-body py-4">
              no puzzles scheduled yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
