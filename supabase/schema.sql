-- ===========================================
-- cinedle database schema
-- ===========================================

-- users (optional auth — anonymous users get a cookie-based id)
create table users (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  email text unique,
  avatar_url text,
  is_anonymous boolean default true,
  cookie_id text unique,
  current_streak integer default 0,
  max_streak integer default 0,
  games_played integer default 0,
  games_won integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- movie pool
create table movies (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer unique not null,
  title text not null,
  year integer,
  poster_url text,
  backdrop_url text,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  par integer not null check (par between 2 and 6),
  vote_count integer,
  -- metadata
  director text,
  genres text[],
  runtime_minutes integer,
  tagline text,
  overview text,
  imdb_id text,
  created_at timestamptz default now()
);

-- curated reviews per movie, ordered vague → obvious
create table reviews (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references movies(id) on delete cascade,
  review_text text not null,
  display_order integer not null check (display_order between 1 and 6),
  -- metadata
  stars real,
  likes integer default 0,
  liked boolean default false,
  review_date text,
  letterboxd_url text,
  -- attribution
  reviewer_name text not null,
  reviewer_avatar_url text,
  reviewer_profile_url text,
  review_source text default 'letterboxd',
  unique (movie_id, display_order)
);

-- daily puzzle schedule
create table daily_puzzles (
  id uuid primary key default gen_random_uuid(),
  movie_id uuid not null references movies(id),
  puzzle_date date unique not null,
  puzzle_number integer not null default 0,
  created_at timestamptz default now()
);

-- game results (tracks each user's attempt per puzzle)
create table game_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  puzzle_id uuid not null references daily_puzzles(id) on delete cascade,
  guesses jsonb not null default '[]',
  num_guesses integer not null,
  won boolean not null,
  completed_at timestamptz default now(),
  unique (user_id, puzzle_id)
);

-- indexes
create index idx_daily_puzzles_date on daily_puzzles(puzzle_date);
create index idx_game_results_user on game_results(user_id);
create index idx_game_results_puzzle on game_results(puzzle_id);
create index idx_movies_tmdb_id on movies(tmdb_id);
create index idx_users_cookie_id on users(cookie_id);

-- TODO: user_profiles table (child of users)
-- avatar, bio, favorite genres, social links, etc.

-- ===========================================
-- rls (all access goes through service role key
-- via next.js api routes, so no anon policies needed)
-- ===========================================
alter table users enable row level security;
alter table movies enable row level security;
alter table reviews enable row level security;
alter table daily_puzzles enable row level security;
alter table game_results enable row level security;
