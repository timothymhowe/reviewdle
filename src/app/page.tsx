import Game from "@/components/Game";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center font-sans">
      <header className="w-full border-b border-lbx-border">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-baseline justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white lowercase font-sans">
            reviewdle
          </h1>
          <span className="text-[10px] uppercase tracking-[0.15em] text-lbx-body">
            daily
          </span>
        </div>
      </header>
      <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8">
        <Game />
      </main>
    </div>
  );
}
