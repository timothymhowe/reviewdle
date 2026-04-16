# Database Schema

Reviewdle uses PostgreSQL via Supabase. All access goes through server-side API routes using the service role key — no direct client-to-database connections.

## Tables

### `roles`
Simple lookup table for user roles.

| Column | Type | Notes |
|--------|------|-------|
| id | integer | PK. 0 = user, 1 = admin |
| name | text | Human-readable role name |

Seeded with two rows. Foreign keyed from `users.role_id`. Could add more roles later (moderator, etc.) without schema changes.

### `users`
Tracks both anonymous and authenticated users.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| display_name | text | Nullable until they sign up |
| email | text | Unique, nullable for anonymous |
| avatar_url | text | |
| role_id | integer | FK to `roles.id`, default 0 (user) |
| is_anonymous | boolean | True until they create an account |
| cookie_id | text | Unique identifier set via HTTP cookie |
| current_streak | integer | Running win streak |
| max_streak | integer | All-time best streak |
| games_played | integer | |
| games_won | integer | |

Anonymous users get a `cookie_id` on first visit. When they sign up, the same row gets upgraded with email/name — their history carries over.

### `movies`
The pool of movies available for puzzles. Metadata is auto-populated from TMDB when a movie is added via the admin panel.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| tmdb_id | integer | Unique. Links to TMDB for poster CDN, search, etc. |
| title | text | |
| year | integer | |
| poster_url | text | TMDB poster path (prepend CDN base URL) |
| backdrop_url | text | |
| difficulty | text | `easy`, `medium`, or `hard` — auto-assigned from vote count |
| par | integer | 2-6. Expected number of reviews to guess it |
| vote_count | integer | From TMDB. Used to auto-assign difficulty |
| director | text | |
| cast_members | text[] | Top 3 billed actors from TMDB credits |
| genres | text[] | |
| runtime_minutes | integer | |
| studio | text | Primary production company |
| tagline | text | |
| overview | text | |
| imdb_id | text | |

**Why `difficulty` and `par` are on the movie, not the puzzle:** A movie's recognizability doesn't change between puzzles. These are properties of the content, not the game instance.

### `reviews`
Curated reviews per movie, ordered from vague to obvious. Sourced from Letterboxd via the admin scraper.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| movie_id | uuid | FK to `movies.id`, cascades on delete |
| review_text | text | May contain safe HTML (`<em>`, `<b>`, `<br>`) |
| display_order | integer | 1-6. 1 = most vague, 6 = most obvious |
| stars | real | Reviewer's star rating (0.5-5) |
| likes | integer | Like count on Letterboxd |
| liked | boolean | Whether the reviewer hearted the film |
| review_date | text | Format: `dd Mon yyyy` |
| letterboxd_url | text | Direct link to the review on Letterboxd |
| reviewer_name | text | |
| reviewer_avatar_url | text | |
| reviewer_profile_url | text | Link to reviewer's Letterboxd profile |
| review_source | text | Default `letterboxd` |

**Why `display_order` lives on the review, not a join table:** Each movie's reviews are curated once in a specific vague-to-obvious order. This order is a property of the curation, not the puzzle schedule. A movie will always use the same reviews in the same order regardless of when it's scheduled. A join table would add indirection for zero benefit — a movie is never puzzled twice with different review orderings.

**Unique constraint** on `(movie_id, display_order)` ensures no duplicate positions.

### `daily_puzzles`
Maps movies to dates. One puzzle per day.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| movie_id | uuid | FK to `movies.id` |
| puzzle_date | date | Unique. The day this puzzle goes live |
| puzzle_number | integer | Sequential number, recalculated on insert/delete |

**Why `puzzle_number` is stored, not computed:** It's used in URLs (`/puzzle/42`) and share text (`Reviewdle #042`). Computing it from row position on every read would be fragile and slow at scale. It's recalculated via a Supabase RPC function whenever puzzles are added or removed, so it stays consistent with date ordering.

### `game_results`
Records each user's attempt at each puzzle.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to `users.id`, cascades on delete |
| puzzle_id | uuid | FK to `daily_puzzles.id`, cascades on delete |
| guesses | jsonb | Array of `{tmdb_id, title, correct}` |
| num_guesses | integer | Denormalized for easy querying |
| won | boolean | |
| completed_at | timestamptz | |

**Unique constraint** on `(user_id, puzzle_id)` — one attempt per user per puzzle.

**Why guesses are JSONB, not a separate table:** The guess history is only ever read as a whole unit (for the share text, results display). It's never queried individually. JSONB keeps it simple — one row per game, no joins.

## Row Level Security

RLS is enabled on all tables. All database access goes through Next.js API routes using the Supabase service role key, which bypasses RLS. This means:

- No anon policies needed
- The API routes are the access control layer
- Admin routes will be gated by checking `role_id` on the authenticated user

## Indexes

- `daily_puzzles(puzzle_date)` — fast lookup for today's puzzle
- `game_results(user_id)` — user's game history
- `game_results(puzzle_id)` — puzzle completion stats
- `movies(tmdb_id)` — dedup check on movie add
- `users(cookie_id)` — anonymous user lookup
