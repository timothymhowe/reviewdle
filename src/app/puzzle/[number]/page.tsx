import { redirect } from "next/navigation";
import Game from "@/components/Game";
import PuzzleNav from "@/components/PuzzleNav";
import { HowToPlayButton } from "@/components/HowToPlay";
import { getLatestPuzzleNumber } from "@/lib/supabase";

export default async function PuzzlePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const puzzleNumber = parseInt(number);

  // if this is today's puzzle, redirect to / for a clean url
  const latest = await getLatestPuzzleNumber();
  if (latest && puzzleNumber === latest) {
    redirect("/");
  }

  return (
    <div className="flex flex-col flex-1 items-center font-sans">
      <header className="w-full border-b border-lbx-border">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between">
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
          <div className="flex items-center gap-3">
            <a href="/archive" className="px-2.5 py-1 bg-lbx-surface border border-lbx-border text-lbx-muted hover:text-foreground hover:border-lbx-muted hover:bg-lbx-surface-light transition-colors text-[10px] uppercase tracking-wider font-semibold no-underline">
              archive
            </a>
            <HowToPlayButton />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-xl mx-auto px-5 py-6">
        <Game puzzleNumber={puzzleNumber} />
      </main>
      <footer className="w-full border-t border-lbx-border py-4">
        <div className="max-w-xl mx-auto px-5 text-[9px] text-lbx-body/60 leading-relaxed text-center">
          <p>
            reviewdle is not affiliated with, endorsed by, or associated with letterboxd ltd. all user reviews displayed on this site are sourced from{" "}
            <a href="https://letterboxd.com" target="_blank" rel="noopener noreferrer" className="text-lbx-body hover:text-lbx-green transition-colors">letterboxd.com</a>
            {" "}and remain the property of their respective authors. movie data provided by{" "}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="text-lbx-body hover:text-lbx-green transition-colors">tmdb</a>.
          </p>
          <p className="mt-1.5">&copy; 2026 ailette, llc</p>
        </div>
      </footer>
    </div>
  );
}
