"use client";

interface ParBadgeProps {
  difficulty: "easy" | "medium" | "hard";
  par: number;
}

const difficultyColor = {
  easy: "text-lbx-green",
  medium: "text-lbx-orange",
  hard: "text-red-500",
};

export default function ParBadge({ difficulty, par }: ParBadgeProps) {
  return (
    <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.15em]">
      <span className={`font-semibold ${difficultyColor[difficulty]}`}>
        {difficulty}
      </span>
      <span className="text-lbx-body">
        par {par}
      </span>
    </div>
  );
}
