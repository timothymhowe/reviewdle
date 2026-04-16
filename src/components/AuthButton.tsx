"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

function syncGameStates(token: string) {
  const gameStates: { puzzleId: string; guesses: unknown[]; status: string }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("reviewdle-state-")) {
      try {
        const state = JSON.parse(localStorage.getItem(key)!);
        if (state.puzzleId && (state.status === "won" || state.status === "lost")) {
          gameStates.push(state);
        }
      } catch { /* skip */ }
    }
  }
  if (gameStates.length > 0) {
    fetch("/api/auth/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gameStates }),
    });
  }
}

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        if (session?.access_token) {
          await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });

          // sync localStorage game states on sign in
          if (event === "SIGNED_IN") {
            syncGameStates(session.access_token);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function signIn() {
    await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signOut() {
    await supabaseBrowser.auth.signOut();
    setUser(null);
  }

  if (loading) return null;

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.user_metadata?.avatar_url && (
          <img
            src={user.user_metadata.avatar_url}
            alt=""
            className="h-5 w-5 rounded-full"
          />
        )}
        <button
          onClick={signOut}
          className="text-[10px] text-lbx-body hover:text-foreground transition-colors"
        >
          sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="px-2.5 py-1 bg-lbx-surface border border-lbx-border text-lbx-muted hover:text-foreground hover:border-lbx-muted hover:bg-lbx-surface-light transition-colors text-[10px] uppercase tracking-wider font-semibold"
    >
      sign in
    </button>
  );
}
