import * as cheerio from "cheerio";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ScrapedReview {
  review_text: string;
  stars: number | null;
  likes: number;
  liked: boolean;
  review_date: string;
  reviewer_name: string;
  reviewer_avatar_url: string | null;
  reviewer_profile_url: string;
  letterboxd_url: string;
  partial: boolean;
}

export async function scrapeReview(url: string): Promise<ScrapedReview | null> {
  let reviewUrl = url.trim();
  if (!reviewUrl.startsWith("http")) {
    reviewUrl = `https://letterboxd.com${reviewUrl.startsWith("/") ? "" : "/"}${reviewUrl}`;
  }
  const originalUrl = reviewUrl;

  // /1/, /2/ etc get blocked by cloudflare — strip to scrape user data,
  // but preserve the original url for linking
  const hasNumberedSuffix = /\/\d+\/?$/.test(reviewUrl);
  const fetchUrl = reviewUrl.replace(/\/\d+\/?$/, "/");

  const res = await fetch(fetchUrl, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);

  // reviewer info (always available from the base url)
  const avatarEl = $("a.avatar img").first();
  const avatarUrl = avatarEl.attr("src") || null;
  const reviewerName = avatarEl.attr("alt") || "";
  const avatarLink = avatarEl.closest("a").attr("href") || "";
  const profileUrl = avatarLink
    ? `https://letterboxd.com${avatarLink}`
    : "";

  // review date
  const viewDateEl = $("p.view-date");
  const dateLinks = viewDateEl.find("a");
  let reviewDate = "";
  if (dateLinks.length >= 3) {
    const day = dateLinks.eq(0).text().trim();
    const month = dateLinks.eq(1).text().trim();
    const year = dateLinks.eq(2).text().trim();
    reviewDate = `${day} ${month} ${year}`;
  }

  if (hasNumberedSuffix) {
    // partial scrape — got user data, rest needs manual entry
    return {
      review_text: "",
      stars: null,
      likes: 0,
      liked: false,
      review_date: reviewDate,
      reviewer_name: reviewerName,
      reviewer_avatar_url: avatarUrl,
      reviewer_profile_url: profileUrl,
      letterboxd_url: originalUrl,
      partial: true,
    };
  }

  // full scrape — preserve formatting
  const reviewBody = $(".js-review-body");
  const reviewHtml = reviewBody.find("p").map((_, el) => $(el).html()?.trim()).get().join("<br><br>") || reviewBody.html()?.trim() || "";
  const reviewText = sanitizeHtml(reviewHtml);

  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const stars = parseStars(ogTitle);

  const likeEl = $(".review-like");
  const likesCount = parseInt(likeEl.attr("data-count") || "0", 10);

  const liked = $(".inline-liked").length > 0;

  if (!reviewText) return null;

  return {
    review_text: reviewText,
    stars,
    likes: likesCount,
    liked,
    review_date: reviewDate,
    reviewer_name: reviewerName,
    reviewer_avatar_url: avatarUrl,
    reviewer_profile_url: profileUrl,
    letterboxd_url: originalUrl,
    partial: false,
  };
}

function sanitizeHtml(html: string): string {
  // only allow safe formatting tags
  return html.replace(/<(?!\/?(?:em|i|b|strong|br)\b)[^>]+>/gi, "").trim();
}

function parseStars(ogTitle: string): number | null {
  const match = ogTitle.match(/([★½]+)/);
  if (!match) return null;
  const starStr = match[1];
  let count = 0;
  for (const char of starStr) {
    if (char === "★") count += 1;
    else if (char === "½") count += 0.5;
  }
  return count || null;
}
