"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { useApp } from "./providers";
import { CITATION_SEP, type Citation } from "@/lib/analysis";
import { cn } from "@/lib/utils";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  engine?: string;
}

const SUGGESTIONS = [
  "Can my RTX 3060 run Cyberpunk 2077 at 1440p?",
  "Where does Elden Ring run best?",
  "Compare Hogwarts Legacy on Switch 2 and Steam Deck",
  "Open-world games over 60 fps on Steam Deck",
];

export { CITATION_SEP };

/** POSTs to /api/assistant and streams text; citations arrive after a sentinel. */
export async function streamAssistant(messages: ChatMsg[], build: unknown, onText: (t: string) => void) {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: messages.map(({ role, content }) => ({ role, content })), build }),
  });
  if (!res.ok || !res.body) throw new Error(`Assistant unavailable (${res.status})`);
  const engine = res.headers.get("x-assistant-engine") ?? "local";
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    full += dec.decode(value, { stream: true });
    onText(full.split(CITATION_SEP)[0]);
  }
  const [text, cites] = full.split(CITATION_SEP);
  let citations: Citation[] = [];
  try {
    citations = cites ? JSON.parse(cites) : [];
  } catch {}
  return { text, citations, engine };
}

/** Minimal, safe markdown: bold, italic, "- " lists and [S1] citation chips. */
export function RichText({ text, citations = [] }: { text: string; citations?: Citation[] }) {
  const blocks = text.split(/\n{2,}/);
  const inline = (s: string, k: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|\[S\d+\])/g);
    return parts.map((p, i) => {
      const key = `${k}-${i}`;
      if (/^\*\*.+\*\*$/.test(p)) return <strong key={key} className="font-semibold">{p.slice(2, -2)}</strong>;
      if (/^(\*|_).+(\*|_)$/.test(p)) return <em key={key}>{p.slice(1, -1)}</em>;
      const m = /^\[(S\d+)\]$/.exec(p);
      if (m) {
        const c = citations.find((x) => x.id === m[1]);
        return c?.href ? (
          <Link key={key} href={c.href} title={c.label} className="mx-0.5 inline-flex h-[18px] items-center rounded-md bg-surface px-1 align-[1px] text-[10.5px] font-medium text-gold-ink hover:bg-gold-soft/50">
            {m[1]}
          </Link>
        ) : (
          <sup key={key} title={c?.label} className="text-[10px] text-gold-ink">{m[1]}</sup>
        );
      }
      return <Fragment key={key}>{p}</Fragment>;
    });
  };
  return (
    <div className="space-y-2.5">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => l.startsWith("- ") || !l.trim()) || (lines.length > 1 && lines.slice(1).every((l) => l.startsWith("- ")))) {
          const head = lines[0].startsWith("- ") ? null : lines[0];
          return (
            <div key={i}>
              {head && <p>{inline(head, `h${i}`)}</p>}
              <ul className="mt-1.5 space-y-1">
                {lines.filter((l) => l.startsWith("- ")).map((l, j) => (
                  <li key={j} className="flex gap-2"><span className="text-gold">•</span><span>{inline(l.slice(2), `${i}-${j}`)}</span></li>
                ))}
              </ul>
            </div>
          );
        }
        return <p key={i}>{inline(b, `${i}`)}</p>;
      })}
    </div>
  );
}

export function SourcesList({ citations }: { citations: Citation[] }) {
  if (!citations.length) return null;
  return (
    <details className="mt-3 text-xs text-muted">
      <summary className="cursor-pointer select-none hover:text-ink">Sources ({citations.length})</summary>
      <ol className="mt-2 space-y-1">
        {citations.map((c) => (
          <li key={c.id}>
            <span className="tabular text-gold-ink">{c.id}</span>{" "}
            {c.href ? <Link className="underline-offset-2 hover:underline" href={c.href}>{c.label}</Link> : c.label}
          </li>
        ))}
      </ol>
    </details>
  );
}

export function useChat() {
  const { activeBuild } = useApp();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [busy, setBusy] = useState(false);
  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next: ChatMsg[] = [...msgs, { role: "user", content: text.trim() }];
    setMsgs([...next, { role: "assistant", content: "" }]);
    setBusy(true);
    try {
      const r = await streamAssistant(next, activeBuild, (t) =>
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: t }]),
      );
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: r.text, citations: r.citations, engine: r.engine }]);
    } catch (e) {
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: `Sorry — ${(e as Error).message}.` }]);
    } finally {
      setBusy(false);
    }
  };
  return { msgs, busy, send, reset: () => setMsgs([]) };
}

export function ChatThread({ msgs, busy, onSuggest }: { msgs: ChatMsg[]; busy: boolean; onSuggest: (s: string) => void }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // block body on purpose: newer browsers return a Promise from scrollIntoView, which must not be the cleanup
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);
  if (!msgs.length)
    return (
      <div className="p-1">
        <p className="text-sm text-muted">Ask anything about games, platforms and performance. Answers use only the FRAMEWISE database and cite their sources.</p>
        <div className="mt-4 grid gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => onSuggest(s)} className="hairline rounded-2xl bg-card px-4 py-3 text-left text-[13.5px] transition hover:border-line-strong hover:shadow-soft">
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  return (
    <div className="space-y-4" aria-live="polite">
      {msgs.map((m, i) => (
        <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
          <div className={cn("max-w-[92%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed", m.role === "user" ? "bg-ink text-bg" : "hairline bg-card")}>
            {m.role === "assistant" && !m.content && busy ? (
              <span className="flex gap-1 py-1.5" aria-label="Thinking">
                {[0, 1, 2].map((d) => (
                  <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-gold" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: d * 0.15 }} />
                ))}
              </span>
            ) : m.role === "assistant" ? (
              <>
                <RichText text={m.content} citations={m.citations} />
                {m.citations && <SourcesList citations={m.citations} />}
                {m.engine && <p className="mt-2 text-[10.5px] uppercase tracking-[0.14em] text-muted">{m.engine === "claude" ? "Answered by Claude over FRAMEWISE data" : "Answered by the offline FRAMEWISE engine"}</p>}
              </>
            ) : (
              m.content
            )}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

export function ChatInput({ onSend, busy, autoFocus }: { onSend: (t: string) => void; busy: boolean; autoFocus?: boolean }) {
  const [v, setV] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend(v);
        setV("");
      }}
      className="hairline flex items-center gap-2 rounded-full bg-card p-1.5 pl-4 shadow-soft"
    >
      <input autoFocus={autoFocus} value={v} onChange={(e) => setV(e.target.value)} placeholder="Ask about any game or platform…" className="h-9 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted" aria-label="Message the AI assistant" />
      <button type="submit" disabled={busy || !v.trim()} className="grid h-9 w-9 place-items-center rounded-full bg-ink text-bg transition disabled:opacity-40" aria-label="Send">
        <ArrowUp size={16} />
      </button>
    </form>
  );
}

export function AssistantWidget() {
  const { assistant, openAssistant, closeAssistant } = useApp();
  const chat = useChat();
  const lastNonce = useRef(0);

  useEffect(() => {
    if (assistant.open && assistant.prompt && assistant.nonce !== lastNonce.current) {
      lastNonce.current = assistant.nonce;
      void chat.send(assistant.prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant]);

  return (
    <>
      <AnimatePresence>
        {!assistant.open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => openAssistant()}
            className="gold-gradient fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center gap-2 rounded-full text-sm font-medium shadow-lift sm:bottom-5 sm:right-5 sm:w-auto sm:px-5"
            aria-label="Open AI assistant"
          >
            <Sparkles size={16} /> <span className="hidden sm:inline">Ask FRAMEWISE</span>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {assistant.open && (
          <motion.aside
            role="dialog"
            aria-label="AI assistant"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="glass hairline fixed inset-x-3 bottom-3 z-50 flex max-h-[78vh] flex-col overflow-hidden rounded-3xl shadow-lift sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[420px]"
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <span className="gold-gradient grid h-8 w-8 place-items-center rounded-xl"><Sparkles size={15} /></span>
              <div className="flex-1">
                <p className="font-display text-[15px] font-semibold">FRAMEWISE Assistant</p>
                <p className="text-[11.5px] text-muted">Grounded in our database · never invents benchmarks</p>
              </div>
              {chat.msgs.length > 0 && <button onClick={chat.reset} className="text-xs text-muted hover:text-ink">Clear</button>}
              <button onClick={closeAssistant} className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface" aria-label="Close assistant"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ChatThread msgs={chat.msgs} busy={chat.busy} onSuggest={chat.send} />
            </div>
            <div className="border-t border-line p-3">
              <ChatInput onSend={chat.send} busy={chat.busy} autoFocus />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
