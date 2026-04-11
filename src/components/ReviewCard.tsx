"use client";

import type { ReviewClue } from "@/types";

interface ReviewCardProps {
  review: ReviewClue;
  reviewNumber: number;
  isLatest: boolean;
}

function starsDisplay(stars: number): string {
  const full = Math.floor(stars);
  const half = stars % 1 >= 0.5;
  return "\u2605".repeat(full) + (half ? "\u00BD" : "");
}

export default function ReviewCard({ review, reviewNumber, isLatest }: ReviewCardProps) {
  return (
    <div className="animate-slide-in border-t border-lbx-border pt-3 pb-2">
      <div className="flex gap-2.5">
        {/* avatar */}
        {review.reviewer_avatar_url ? (
          <img
            src={review.reviewer_avatar_url}
            alt=""
            className="h-7 w-7 rounded-full object-cover shrink-0 border border-lbx-border"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-lbx-surface-light shrink-0 border border-lbx-border" />
        )}

        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {/* reviewer info line */}
          <div className="flex items-center gap-1.5 text-[11px] flex-wrap">
            {review.stars && (
              <span className="text-lbx-green text-[10px]">{starsDisplay(review.stars)}</span>
            )}
            {review.liked && (
              <svg width="12" height="10" viewBox="0 0 14 12" className="fill-lbx-orange">
                <path fillRule="evenodd" d="M10.52.5C8.73.5 7 2.42 7 2.42S5.27.5 3.48.5C1.7.5 0 1.3 0 3.66 0 5.33 1.75 6.8 1.75 6.8L7 11.5l5.25-4.7S14 5.33 14 3.66C14 1.3 12.3.5 10.52.5" />
              </svg>
            )}
            <span className="text-lbx-body">watched by</span>
            {review.reviewer_profile_url ? (
              <a
                href={review.reviewer_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-foreground hover:text-lbx-green transition-colors"
              >
                {review.reviewer_name}
              </a>
            ) : (
              <span className="font-semibold text-foreground">{review.reviewer_name}</span>
            )}
            {review.review_date && (
              <span className="text-lbx-body">{review.review_date}</span>
            )}
          </div>

          {/* review text */}
          <div
            className={`font-serif text-[14px] leading-[1.7] [&_em]:italic [&_i]:italic [&_b]:font-bold [&_strong]:font-bold ${
              isLatest ? "text-foreground" : "text-lbx-muted"
            }`}
            dangerouslySetInnerHTML={{ __html: review.text }}
          />

          {/* likes */}
          {review.likes > 0 && (
            <div className="text-[10px] text-lbx-body">
              {review.likes.toLocaleString()} likes
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
