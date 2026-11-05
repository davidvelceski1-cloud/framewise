"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { Build } from "@/lib/analysis";
import type { PlatformId } from "@/lib/types";

/* ───────── tiny localStorage-backed store ───────── */

type Listener = () => void;
const listeners = new Set<Listener>();
const cache = new Map<string, unknown>();

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  if (cache.has(key)) return cache.get(key) as T;
  try {
    const raw = window.localStorage.getItem(key);
    const v = raw ? (JSON.parse(raw) as T) : fallback;
    cache.set(key, v);
    return v;
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T) {
  cache.set(key, value);
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: Listener) {
  listeners.add(l);
  const onStorage = () => {
    cache.clear();
    l();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLocal<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [fb] = useState(fallback);
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fb),
    () => fb,
  );
  const set = useCallback(
    (v: T | ((prev: T) => T)) => write(key, typeof v === "function" ? (v as (p: T) => T)(read(key, fb)) : v),
    [key, fb],
  );
  return [value, set];
}

/* ───────── types ───────── */

export interface User {
  email: string;
  name: string;
  provider: "email" | "google";
  role: "member" | "admin";
}

export interface SavedBuild extends Build {
  id: string;
  name: string;
}

export interface SavedComparison {
  id: string;
  title: string;
  url: string;
  createdAt: string;
}

export interface UserData {
  builds: SavedBuild[];
  activeBuildId?: string;
  consoles: PlatformId[];
  favorites: string[];
  comparisons: SavedComparison[];
  alerts: string[];
}

const emptyData: UserData = { builds: [], consoles: [], favorites: [], comparisons: [], alerts: [] };

interface AppCtx {
  theme: "light" | "dark";
  toggleTheme: () => void;
  user: User | null;
  signIn: (email: string, password: string, mode: "signin" | "signup", name?: string) => { ok: boolean; error?: string };
  signInWithGoogle: () => void;
  signOut: () => void;
  data: UserData;
  update: (fn: (d: UserData) => UserData) => void;
  activeBuild: SavedBuild | undefined;
  assistant: { open: boolean; prompt?: string; nonce: number };
  openAssistant: (prompt?: string) => void;
  closeAssistant: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp outside provider");
  return c;
}

/* NOTE: demo-only auth. Accounts live in this browser's localStorage and passwords
   are hashed with SHA-256 only to avoid storing plain text. Replace with Supabase Auth
   (email + Google OAuth) for production — see README. */
async function sha(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useLocal<"light" | "dark">("fw:theme", "light");
  const [user, setUser] = useLocal<User | null>("fw:user", null);
  const [accounts, setAccounts] = useLocal<Record<string, { name: string; hash: string }>>("fw:accounts", {});
  const dataKey = `fw:data:${user?.email ?? "guest"}`;
  const [data, setData] = useLocal<UserData>(dataKey, emptyData);
  const [assistant, setAssistant] = useState<{ open: boolean; prompt?: string; nonce: number }>({ open: false, nonce: 0 });
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value: AppCtx = {
    theme,
    toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    user,
    signIn: (email, password, mode, name) => {
      const e = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(e)) return { ok: false, error: "Enter a valid email address." };
      if (password.length < 8) return { ok: false, error: "Passwords need at least 8 characters." };
      const acc = accounts[e];
      if (mode === "signin" && !acc) return { ok: false, error: "No account with that email on this device. Create one instead." };
      if (mode === "signup" && acc) return { ok: false, error: "An account with this email already exists." };
      // hash asynchronously, then commit
      void sha(`${e}:${password}`).then((h) => {
        if (mode === "signup") {
          setAccounts({ ...accounts, [e]: { name: name || e.split("@")[0], hash: h } });
          setUser({ email: e, name: name || e.split("@")[0], provider: "email", role: "admin" });
        } else if (acc.hash === h) {
          setUser({ email: e, name: acc.name, provider: "email", role: "admin" });
        } else {
          window.dispatchEvent(new CustomEvent("fw:auth-error", { detail: "Incorrect password." }));
        }
      });
      return { ok: true };
    },
    signInWithGoogle: () => setUser({ email: "demo.google@framewise.app", name: "Google Demo User", provider: "google", role: "admin" }),
    signOut: () => setUser(null),
    data,
    update: (fn) => setData((d) => fn({ ...emptyData, ...d })),
    activeBuild: data.builds.find((b) => b.id === data.activeBuildId) ?? data.builds[0],
    assistant,
    openAssistant: (prompt) => setAssistant((a) => ({ open: true, prompt, nonce: a.nonce + 1 })),
    closeAssistant: () => setAssistant((a) => ({ ...a, open: false })),
    paletteOpen,
    setPaletteOpen,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
