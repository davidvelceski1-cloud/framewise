"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ChatInput, ChatThread, useChat } from "./assistant";
import { useApp } from "./providers";
import { Pill } from "./ui";

export function AssistantPage({ hasClaude }: { hasClaude: boolean }) {
  const chat = useChat();
  const { activeBuild } = useApp();
  return (
    <div className="hero-gradient -mt-[68px] min-h-[80vh] pb-10 pt-[120px]">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <span className="gold-gradient mx-auto grid h-12 w-12 place-items-center rounded-2xl shadow-soft"><Sparkles size={20} /></span>
          <h1 className="mt-5 font-display text-4xl font-semibold md:text-5xl">Ask FRAMEWISE</h1>
          <p className="mx-auto mt-3 max-w-lg text-muted">Natural-language answers grounded only in our database. Every figure is cited; missing data is called out, never guessed.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Pill tone={hasClaude ? "gold" : "neutral"}>{hasClaude ? "Powered by Claude + retrieval" : "Offline engine (set ANTHROPIC_API_KEY for Claude)"}</Pill>
            {activeBuild ? <Pill>Using build: {activeBuild.gpu}</Pill> : <Link href="/can-i-run"><Pill>Save a PC build for personal answers →</Pill></Link>}
            <Pill>Press ⌘K anywhere</Pill>
          </div>
        </div>
        <div className="card mt-10 p-5 md:p-7">
          <ChatThread msgs={chat.msgs} busy={chat.busy} onSuggest={chat.send} />
          <div className="mt-6"><ChatInput onSend={chat.send} busy={chat.busy} /></div>
        </div>
      </div>
    </div>
  );
}
