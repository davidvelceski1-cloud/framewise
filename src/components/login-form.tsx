"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "./providers";
import { cn } from "@/lib/utils";

function safeNext(n: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard";
}

export function LoginForm() {
  const { user, signIn, signInWithGoogle } = useApp();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);
  useEffect(() => {
    const on = (e: Event) => setError((e as CustomEvent<string>).detail);
    window.addEventListener("fw:auth-error", on);
    return () => window.removeEventListener("fw:auth-error", on);
  }, []);

  const field = "hairline h-11 w-full rounded-xl bg-card px-3.5 text-[14px]";
  return (
    <div className="glass hairline w-full max-w-md rounded-[28px] p-8 shadow-lift">
      <h1 className="font-display text-3xl font-semibold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="mt-2 text-sm text-muted">Save PC builds, consoles, favorites, comparisons and patch alerts.</p>

      <button onClick={signInWithGoogle} className="hairline mt-7 flex h-11 w-full items-center justify-center gap-3 rounded-full bg-card text-sm font-medium hover:shadow-soft">
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
        Continue with Google
      </button>
      <div className="my-6 flex items-center gap-3 text-[12px] text-muted"><span className="h-px flex-1 bg-line" />or with email<span className="h-px flex-1 bg-line" /></div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const r = signIn(email, password, mode, name);
          if (!r.ok) setError(r.error ?? "Something went wrong.");
        }}
      >
        {mode === "signup" && <input className={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" autoComplete="name" />}
        <input className={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" autoComplete="email" required />
        <input className={field} type="password" placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" autoComplete={mode === "signin" ? "current-password" : "new-password"} required />
        {error && <p className="text-[13px] text-red-700 dark:text-red-300" role="alert">{error}</p>}
        <button className="h-11 w-full rounded-full bg-ink text-sm font-medium text-bg">{mode === "signin" ? "Sign in" : "Create account"}</button>
      </form>
      <p className="mt-5 text-center text-[13px] text-muted">
        {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
        <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); }} className={cn("font-medium text-gold-ink hover:underline")}>
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
      <p className="mt-6 rounded-xl bg-surface px-4 py-3 text-[11.5px] leading-relaxed text-muted">
        Demo authentication: accounts are stored only in this browser, and Google sign-in is simulated. Connect Supabase Auth for production (see README).
      </p>
    </div>
  );
}
