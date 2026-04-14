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

              <div className="flex flex-col gap-5">
                <div>
                  <div className="text-base font-bold text-foreground">how to play</div>
                  <div className="text-[11px] text-lbx-body mt-1">guess the movie from real letterboxd reviews</div>
                </div>

                <div className="flex flex-col gap-3 text-[12px] text-lbx-muted leading-relaxed">
                  <div className="flex gap-3 items-start">
                    <span className="text-lbx-green font-mono text-[10px] mt-0.5 shrink-0">01</span>
                    <p>you get up to <span className="text-foreground">6 reviews</span>, starting vague and getting more obvious</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-lbx-green font-mono text-[10px] mt-0.5 shrink-0">02</span>
                    <p><span className="text-foreground">one guess per review</span> — a wrong guess reveals the next one</p>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="text-lbx-green font-mono text-[10px] mt-0.5 shrink-0">03</span>
                    <div>
                      <p>fewer reviews = better score, like golf</p>
                      <div className="mt-2 text-[10px] flex flex-col gap-0.5">
                        <div className="flex items-center gap-2"><span className="text-lbx-green">ace</span><span className="text-lbx-body/40">first try</span></div>
                        <div className="flex items-center gap-2"><span className="text-lbx-green">eagle</span><span className="text-lbx-body/40">2 under par</span></div>
                        <div className="flex items-center gap-2"><span className="text-lbx-green">birdie</span><span className="text-lbx-body/40">1 under par</span></div>
                        <div className="flex items-center gap-2"><span className="text-lbx-muted">par</span><span className="text-lbx-body/40">expected</span></div>
                        <div className="flex items-center gap-2"><span className="text-lbx-orange">bogey</span><span className="text-lbx-body/40">1 over par</span></div>
                        <div className="flex items-center gap-2"><span className="text-lbx-orange">double bogey</span><span className="text-lbx-body/40">2 over par</span></div>
                        <div className="flex items-center gap-2"><span className="text-red-400">triple bogey</span><span className="text-lbx-body/40">3+ over par</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-lbx-body">
                  a new puzzle every day &middot; browse past puzzles with the arrows
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
