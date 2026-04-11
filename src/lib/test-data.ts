import type { DailyResponse, ReviewClue } from "@/types";

const reviews: ReviewClue[] = [
  {
    text: "a movie about guys being dudes and dudes being guys. vibes.",
    reviewer_name: "sean",
    stars: null,
    likes: 0,
    liked: false,
    review_date: null,
    reviewer_avatar_url: null,
    letterboxd_url: null,
    reviewer_profile_url: "https://letterboxd.com/sean",
  },
  {
    text: "the soundtrack alone deserves its own letterboxd page. pure 70s energy.",
    reviewer_name: "lucy",
    stars: null,
    likes: 0,
    liked: false,
    review_date: null,
    reviewer_avatar_url: null,
    letterboxd_url: null,
    reviewer_profile_url: "https://letterboxd.com/lucy",
  },
  {
    text: "i can't believe they just let them improvise half of this. every scene in the bowling alley is gold.",
    reviewer_name: "davidehrlich",
    stars: null,
    likes: 0,
    liked: false,
    review_date: null,
    reviewer_avatar_url: null,
    letterboxd_url: null,
    reviewer_profile_url: "https://letterboxd.com/davidehrlich",
  },
  {
    text: "jeff bridges has never been more himself. the dude abides and so do i.",
    reviewer_name: "karsten",
    stars: null,
    likes: 0,
    liked: false,
    review_date: null,
    reviewer_avatar_url: null,
    letterboxd_url: null,
    reviewer_profile_url: "https://letterboxd.com/karsten",
  },
  {
    text: "the big lebowski (1998). it's literally called the big lebowski. the dude. white russians. come on.",
    reviewer_name: "hoops",
    stars: null,
    likes: 0,
    liked: false,
    review_date: null,
    reviewer_avatar_url: null,
    letterboxd_url: null,
    reviewer_profile_url: "https://letterboxd.com/hoops",
  },
];

export const TEST_PUZZLE: DailyResponse & {
  answer: {
    title: string;
    year: number;
    poster_url: string;
    tmdb_id: number;
    director: string;
    genres: string[];
  };
} = {
  puzzleId: "test-001",
  puzzleNumber: 1,
  par: 3,
  difficulty: "easy",
  totalReviews: 5,
  reviews,
  answer: {
    title: "The Big Lebowski",
    year: 1998,
    poster_url: "/3bv6WAp6BSxxYvB5ozKFUYuRA8C.jpg",
    tmdb_id: 115,
    director: "Joel Coen",
    genres: ["Comedy", "Crime"],
  },
};
