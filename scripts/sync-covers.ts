/**
 * Sync cover art IDs from IGDB → src/lib/data/covers.json
 *
 *   npm run covers:sync            # fill in games that don't have a cover yet
 *   npm run covers:sync -- --force # re-check every game (manual entries are kept)
 *   npm run covers:sync -- --dry   # show matches without writing
 *
 * Needs TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET (free, from https://dev.twitch.tv/console),
 * read from the environment or .env.local. Only image IDs are stored; images stay on IGDB's CDN.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { allSeedGames } from "../src/lib/data/all";
import type { CoverEntry } from "../src/lib/data/covers";
import { pickBest, queryFor, type IgdbCandidate } from "./cover-match";

try {
  process.loadEnvFile(path.join(process.cwd(), ".env.local"));
} catch {
  /* no .env.local — fall back to the process environment */
}

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const DRY = args.has("--dry");
const OUT = path.join(process.cwd(), "src/lib/data/covers.json");
const { TWITCH_CLIENT_ID: CLIENT_ID, TWITCH_CLIENT_SECRET: CLIENT_SECRET } = process.env;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET.\n" +
      "Create a free app at https://dev.twitch.tv/console (any OAuth redirect, e.g. http://localhost),\n" +
      "then add both values to .env.local and run `npm run covers:sync` again.",
  );
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function token(): Promise<string> {
  const url = `https://id.twitch.tv/oauth2/token?client_id=${encodeURIComponent(CLIENT_ID!)}&client_secret=${encodeURIComponent(CLIENT_SECRET!)}&grant_type=client_credentials`;
  const res = await fetch(url, { method: "POST" });
  if (!res.ok) throw new Error(`Twitch token request failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Twitch token response had no access_token");
  return json.access_token;
}

async function search(accessToken: string, name: string, attempt = 0): Promise<IgdbCandidate[]> {
  const body = `search "${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"; fields name,first_release_date,cover.image_id; where cover != null; limit 15;`;
  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: { "Client-ID": CLIENT_ID!, Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    body,
  });
  if (res.status === 429 && attempt < 5) {
    await sleep(1000 * (attempt + 1)); // IGDB allows ~4 requests/second
    return search(accessToken, name, attempt + 1);
  }
  if (!res.ok) throw new Error(`IGDB search failed for "${name}" (${res.status}): ${await res.text()}`);
  return (await res.json()) as IgdbCandidate[];
}

async function main() {
  const existing = JSON.parse(readFileSync(OUT, "utf8")) as Record<string, CoverEntry>;
  const result: Record<string, CoverEntry> = { ...existing };
  const todo = allSeedGames.filter((g) => !existing[g.slug]?.manual && (FORCE || !(existing[g.slug]?.imageId || existing[g.slug]?.url)));
  console.log(`${allSeedGames.length} games · ${todo.length} to look up${DRY ? " (dry run)" : ""}`);

  const accessToken = await token();
  const unmatched: string[] = [];
  let matched = 0;
  for (const [i, g] of todo.entries()) {
    const { name } = queryFor(g.title, g.releaseDate);
    const best = pickBest(g.title, g.releaseDate, await search(accessToken, name));
    if (best?.cover) {
      result[g.slug] = { imageId: best.cover.image_id, igdbId: best.id, igdbName: best.name };
      matched++;
      console.log(`  ✓ [${i + 1}/${todo.length}] ${g.title} → ${best.name}`);
    } else {
      unmatched.push(`${g.slug}  (${g.title})`);
      console.log(`  · [${i + 1}/${todo.length}] ${g.title} → no confident match`);
    }
    await sleep(280);
  }

  if (!DRY) {
    const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(OUT, JSON.stringify(sorted, null, 2) + "\n");
  }
  console.log(`\nMatched ${matched}/${todo.length}.${DRY ? "" : ` Wrote ${path.relative(process.cwd(), OUT)}.`}`);
  if (unmatched.length) {
    console.log(
      `\nNo confident match (left on generated art). Add these by hand in covers.json, e.g.\n` +
        `  "slug": { "imageId": "<igdb image id>", "manual": true }   or   { "url": "/covers/slug.jpg", "manual": true }\n` +
        unmatched.map((u) => `  - ${u}`).join("\n"),
    );
  }
  console.log("\nRebuild (npm run build) or restart the dev server to show the new covers.");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
