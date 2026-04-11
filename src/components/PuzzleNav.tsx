"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PuzzleNavProps {
  puzzleNumber: number;
}

export default function PuzzleNav({ puzzleNumber }: PuzzleNavProps) {
  const router = useRouter();
  const [totalPuzzles, setTotalPuzzles] = useState(puzzleNumber);

  useEffect(() => {
    fetch(`/api/puzzle/${puzzleNumber}`)
      .then((r) => r.json())
      .then((d) => { if (d.totalPuzzles) setTotalPuzzles(d.totalPuzzles); });
  }, [puzzleNumber]);

  const hasPrev = puzzleNumber > 1;
  const hasNext = puzzleNumber < totalPuzzles;

  return (
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em]">
      <button
        onClick={() => hasPrev && router.push(`/puzzle/${puzzleNumber - 1}`)}
        disabled={!hasPrev}
        className="text-lbx-body hover:text-foreground disabled:opacity-20 transition-colors"
      >
        &larr;
      </button>
      <span className="text-lbx-body font-mono">
        #{String(puzzleNumber).padStart(3, "0")}
      </span>
      <button
        onClick={() => hasNext && router.push(`/puzzle/${puzzleNumber + 1}`)}
        disabled={!hasNext}
        className="text-lbx-body hover:text-foreground disabled:opacity-20 transition-colors"
      >
        &rarr;
      </button>
    </div>
  );
}
