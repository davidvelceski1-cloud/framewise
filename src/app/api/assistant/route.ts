import Anthropic from "@anthropic-ai/sdk";
import { getCatalog } from "@/lib/db";
import { CITATION_SEP, retrieve, type Build } from "@/lib/analysis";


interface Body {
  messages: { role: "user" | "assistant"; content: string }[];
  build?: Partial<Build>;
}

const SYSTEM = `You are the FRAMEWISE assistant, an expert on how video games run across consoles, handhelds and PC.

Ground rules:
- Answer ONLY from the "Retrieved records" provided in the latest user turn. Do not use outside knowledge for any number (fps, resolution, load times, specs, scores, dates).
- Cite every figure with its record tag, e.g. [S2]. Never invent tags.
- If the records do not contain what the user asked for, say plainly that FRAMEWISE has no data for it yet. Never estimate or invent benchmarks yourself; the only estimates you may report are those in records labelled "FRAMEWISE estimator", and you must call them estimates and give their confidence.
- If records are labelled demo data, mention once that figures are demo data.
- Style: calm, precise and brief, at most 120 words. Lead with the direct answer. Use **bold** for the key figure. You may use "- " bullet lists. No headings, no tables.`;

function hasClaudeCredentials() {
  if (process.env.FRAMEWISE_AI === "local") return false;
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const msgs = (body.messages ?? []).filter((m) => m && typeof m.content === "string").slice(-12);
  const last = msgs[msgs.length - 1];
  if (!last || last.role !== "user" || last.content.length > 2000) return new Response("Bad request", { status: 400 });

  const catalog = await getCatalog();
  // Retrieval uses the latest question; fall back to the previous user turn for follow-ups ("and on PS5?").
  let r = retrieve(last.content, catalog, body.build);
  if (!r.games.length) {
    const prev = [...msgs].reverse().slice(1).find((m) => m.role === "user");
    if (prev) {
      const merged = retrieve(`${prev.content} ${last.content}`, catalog, body.build);
      if (merged.games.length) r = merged;
    }
  }
  const citationsJson = JSON.stringify(r.citations);
  const enc = new TextEncoder();

  if (!hasClaudeCredentials()) {
    // Offline engine: deterministic, grounded answer streamed in small chunks.
    const stream = new ReadableStream({
      async start(controller) {
        const words = r.localAnswer.split(/(\s+)/);
        for (let i = 0; i < words.length; i += 6) {
          controller.enqueue(enc.encode(words.slice(i, i + 6).join("")));
          await new Promise((res) => setTimeout(res, 18));
        }
        controller.enqueue(enc.encode(CITATION_SEP + citationsJson));
        controller.close();
      },
    });
    return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "x-assistant-engine": "local" } });
  }

  const client = new Anthropic();
  const history: Anthropic.Beta.Messages.BetaMessageParam[] = msgs.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
  const grounded = `Question: ${last.content}

Retrieved records (intent: ${r.intent}):
${r.context || "(no matching records in the FRAMEWISE database)"}`;

  const stream = new ReadableStream({
    async start(controller) {
      let wrote = false;
      try {
        const s = client.beta.messages.stream({
          model: "claude-opus-5-5",
          max_tokens: 8000,
          system: SYSTEM,
          output_config: { effort: "low" },
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          messages: [...history, { role: "user", content: grounded }],
        });
        for await (const ev of s) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            wrote = true;
            controller.enqueue(enc.encode(ev.delta.text));
          }
        }
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(enc.encode(wrote ? "\n\n_(Response stopped.)_" : r.localAnswer));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(enc.encode("…"));
        }
      } catch (err) {
        console.error("[assistant] Claude request failed, using offline engine:", err instanceof Anthropic.APIError ? `${err.status} ${err.message}` : err);
        if (!wrote) controller.enqueue(enc.encode(r.localAnswer));
      }
      controller.enqueue(enc.encode(CITATION_SEP + citationsJson));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/plain; charset=utf-8", "x-assistant-engine": "claude" } });
}
