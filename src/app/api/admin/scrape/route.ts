import { NextRequest, NextResponse } from "next/server";
import { scrapeReview } from "@/lib/scrape";

// POST — scrape a letterboxd review url
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url } = body as { url: string };

  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const review = await scrapeReview(url);
  if (!review) {
    return NextResponse.json(
      { error: "couldn't scrape that url" },
      { status: 400 }
    );
  }

  return NextResponse.json(review);
}
