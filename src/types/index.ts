export interface User {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_anonymous: boolean;
  cookie_id: string | null;
  current_streak: number;
  max_streak: number;
  games_played: number;
  games_won: number;
}

export interface Movie {
  id: string;
  tmdb_id: number;
  title: string;
  year: number | null;
  poster_url: string | null;
  backdrop_url: string | null;
  difficulty: "easy" | "medium" | "hard";
  par: number;
  vote_count: number | null;
  director: string | null;
  genres: string[] | null;
  runtime_minutes: number | null;
  tagline: string | null;
  overview: string | null;
  imdb_id: string | null;
}

export interface Review {
  id: string;
  movie_id: string;
  review_text: string;
  display_order: number;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  reviewer_profile_url: string | null;
  review_source: string;
}

export interface DailyPuzzle {
  id: string;
  movie_id: string;
  puzzle_date: string;
  puzzle_number: number;
  movie: Movie;
  reviews: Review[];
}

export interface Guess {
  tmdb_id: number;
  title: string;
  correct: boolean;
}

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  date: string;
  puzzleId: string;
  currentReviewIndex: number;
  guesses: Guess[];
  status: GameStatus;
}

export interface TMDBSearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
}

export interface DailyResponse {
  puzzleId: string;
  reviews: ReviewClue[];
  par: number;
  difficulty: "easy" | "medium" | "hard";
  totalReviews: number;
  puzzleNumber: number;
}

export interface ReviewClue {
  text: string;
  stars: number | null;
  likes: number;
  liked: boolean;
  review_date: string | null;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  reviewer_profile_url: string | null;
  letterboxd_url: string | null;
}

export interface GuessResponse {
  correct: boolean;
  gameOver: boolean;
  answer?: {
    title: string;
    year: number | null;
    poster_url: string | null;
    tmdb_id: number;
    director: string | null;
    genres: string[] | null;
  };
}
