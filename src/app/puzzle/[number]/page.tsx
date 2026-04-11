import Game from "@/components/Game";
import PuzzleNav from "@/components/PuzzleNav";

export default async function PuzzlePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const puzzleNumber = parseInt(number);

  return (
    <div className="flex flex-col flex-1 items-center font-sans">
      <header className="w-full border-b border-lbx-border">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white lowercase font-sans flex items-center gap-2">
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
          </h1>
          <PuzzleNav puzzleNumber={puzzleNumber} />
        </div>
      </header>
      <main className="flex-1 w-full max-w-xl mx-auto px-5 py-6">
        <Game puzzleNumber={puzzleNumber} />
      </main>
    </div>
  );
}
