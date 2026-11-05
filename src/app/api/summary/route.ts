import Anthropic from "@anthropic-ai/sdk";
import { getCatalog } from "@/lib/db";
import { comparisonVerdict } from "@/lib/analysis";
import { modeLabels, platformById } from "@/lib/platforms";


/** AI comparison verdict. Uses Claude when credentials exist, otherwise the deterministic writer. */
export async function POST(req: Request) {
  const { game: slug, testIds } = (await req.json().catch(() => ({}))) as { game?: string; testIds?: string[] };
  const cat = await getCatalog();
  const game = cat.games.find((g) => g.slug === slug);
  if (!game || !Array.isArray(testIds)) return Response.json({ error: "Unknown game" }, { status: 400 });
  const tests = cat.tests.filter((t) => testIds.includes(t.id));
  const fallback = comparisonVerdict(game, tests);

  const useClaude = process.env.FRAMEWISE_AI !== "local" && (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  if (!useClaude || tests.length < 2) return Response.json({ summary: fallback, engine: "local" });

  const records = tests
    .map((t) => `${platformById[t.platform].name} – ${modeLabels[t.mode]}: ${t.fpsAvg} fps avg, 1% low ${t.fps1Low}, target ${t.targetFps ?? "uncapped"}, internal ${t.nativeRes}, output ${t.outputRes}, ${t.upscaler}, RT ${t.rayTracing ? "yes" : "no"}, HDR ${t.hdr ? "yes" : "no"}, load ${t.loadSec}s`)
    .join("\n");
  try {
    const client = new Anthropic();
    const msg = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system:
        "You write the plain-language verdict at the top of a cross-platform game performance comparison. Use only the records given; never add numbers that are not in them. Write 3–4 calm, precise sentences, with no headings, lists or markdown. Say which platform is the best overall pick and why, and note the key trade-off.",
      messages: [{ role: "user", content: `Game: ${game.title}\nRecords:\n${records}` }],
    });
    if (msg.stop_reason === "refusal") return Response.json({ summary: fallback, engine: "local" });
    const text = msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    return Response.json({ summary: text || fallback, engine: text ? "claude" : "local" });
  } catch (err) {
    console.error("[summary] Claude request failed:", err instanceof Anthropic.APIError ? err.status : err);
    return Response.json({ summary: fallback, engine: "local" });
  }
}
