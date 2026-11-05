import type { Metadata } from "next";
import { AssistantPage } from "@/components/assistant-page";


export const metadata: Metadata = { title: "AI Assistant", description: "Ask about any game's performance in plain language. Answers are grounded in the FRAMEWISE database and cite their sources." };

export default function Page() {
  const hasClaude = process.env.FRAMEWISE_AI !== "local" && Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  return <AssistantPage hasClaude={hasClaude} />;
}
