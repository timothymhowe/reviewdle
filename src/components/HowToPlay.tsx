"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "reviewdle-seen-how-to-play";

export function HowToPlayButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-lbx-body hover:text-foreground transition-colors text-sm font-medium"
      >
        ?
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-background/80 z-40" onClick={dismiss} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-lbx-surface border border-lbx-border w-full max-w-xs relative p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={dismiss}
                className="absolute top-2.5 right-3 text-lbx-body hover:text-foreground text-xs transition-colors"
              >
                &times;
              </button>

              <div className="flex flex-col gap-4">
                <div className="text-sm font-semibold text-foreground">how to play</div>

                <div className="flex flex-col gap-2.5 text-[12px] text-lbx-muted leading-relaxed">
                  <p>guess the movie from the reviews.</p>
                  <p>
                    each review gets more obvious.
                    <br />
                    one guess per review — wrong guess reveals the next one.
                  </p>
                  <p>fewer reviews = better score.</p>
                  <p>
                    <span className="text-lbx-green">par</span> tells you the expected number of reviews to guess it.
                    beat par for a <span className="text-lbx-green">birdie</span>.
                  </p>
                </div>

                <button
                  onClick={dismiss}
                  className="w-full border border-lbx-green text-lbx-green py-2 text-[11px] uppercase tracking-[0.12em] font-semibold transition-all hover:bg-lbx-green hover:text-background active:scale-[0.97]"
                >
                  play
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
