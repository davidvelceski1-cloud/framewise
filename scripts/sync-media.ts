/**
 * Sync platform photos and studio logos / leadership from Wikimedia → src/lib/data/media.json
 *
 *   npm run media:sync            # look up everything that isn't in media.json yet
 *   npm run media:sync -- --force # re-check every studio and platform (manual entries are kept)
 *   npm run media:sync -- --dry   # print what would be stored without writing
 *
 * No API key needed. Sources:
 *  - Platforms: hand-picked Wikimedia Commons photos (PLATFORM_FILES below).
 *  - Studios: Wikidata — logo (P154), chief executive officer (P169, else director/manager P1037)
 *    and that person's photo (P18). When Wikidata has no CEO, the CEO / president / studio head is
 *    read from the English Wikipedia infobox (`key_people`); missing logos and portraits fall back to
 *    the article's free (Commons) page image. Images are freely licensed Commons files; credits are stored
 *    with each image and shown on the site. Only URLs are stored; images stay on Wikimedia's CDN.
 *
 * Wikidata can lag behind leadership changes, so the site labels CEOs "per Wikidata".
 * To fix a wrong match, set `wikidata` in STUDIO_OVERRIDES (or `null` to skip a studio),
 * or edit media.json by hand and add `"manual": true` to the entry.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { platforms } from "../src/lib/platforms";
import { studios as curated } from "../src/lib/data/studios";
import { allSeedGames, studioNames } from "../src/lib/data/all";
import { mergeStudios } from "../src/lib/data/expand";
import type { MediaFile, MediaImage, StudioMedia } from "../src/lib/data/media";
import { normTitle } from "./cover-match";

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");
const DRY = args.has("--dry");
const OUT = path.join(process.cwd(), "src/lib/data/media.json");
// Wikimedia's User-Agent policy asks clients to identify themselves with a contact URL
const HEADERS = { "User-Agent": "FramewiseMediaSync/1.0 (https://github.com/davidvelceski1-cloud/framewise)", "Api-User-Agent": "FramewiseMediaSync/1.0 (https://github.com/davidvelceski1-cloud/framewise)", Accept: "application/json" };

/** Commons file per platform slug: real product photos, chosen by hand. */
const PLATFORM_FILES: Record<string, string> = {
  ps5: "PlayStation 5 and DualSense with transparent background.png",
  "ps5-pro": "PlayStation 5 Pro no disc drive.jpg",
  "xbox-series-x": "Xbox Series X 2.jpg",
  "xbox-series-s": "Xbox Series S with controller.jpg",
  switch: "Nintendo-Switch-Console-Docked-wJoyConRB.jpg",
  "switch-2": "Nintendo Switch 2 in Docking Console.jpg",
  "steam-deck": "Steam Deck (front).png",
  "pc-mid": "Video über die GeForce RTX 4060 (极客湾Geekerwan) 05.png",
  "pc-high": "Video über die RTX 4080 Super und Vergleichskarten (极客湾Geekerwan) 05.png",
};
const PLATFORM_CAPTIONS: Record<string, string> = {
  "pc-mid": "GeForce RTX 4060 (dual-fan partner card)",
  "pc-high": "GeForce RTX 4080 Super Founders Edition (centre), with the RTX 4090 and RTX 4080",
};

/** Wikidata item per studio slug when the name search picks the wrong thing (null = don't look up). */
const STUDIO_OVERRIDES: Record<string, string | null> = {};

/** Studios whose Wikidata CEO statement is known to be wrong: skip it and use the Wikipedia infobox instead. */
const IGNORE_WIKIDATA_LEADER = new Set([
  "bethesda-softworks", // lists Todd Howard (Bethesda Game Studios' director) as CEO
]);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson<T>(url: URL, attempt = 0): Promise<T> {
  await sleep(1100); // stay well under Wikimedia's anonymous rate limits
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(30_000) });
  if ((res.status === 429 || res.status >= 500) && attempt < 8) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 15_000 * (attempt + 1);
    console.log(`    (rate limited, waiting ${Math.round(wait / 1000)}s)`);
    await sleep(wait);
    return getJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${url.host} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

const api = (host: string, params: Record<string, string>) => {
  const u = new URL(`https://${host}/w/api.php`);
  for (const [k, v] of Object.entries({ format: "json", ...params })) u.searchParams.set(k, v);
  return u;
};

/* ───────── Commons ───────── */
interface ImageInfo {
  thumburl: string;
  thumbwidth: number;
  thumbheight: number;
  descriptionurl: string;
  extmetadata?: Record<string, { value: string }>;
}
const stripHtml = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
const cleanUrl = (u: string) => u.split("?")[0];

/** Resolve Commons file names → thumbnail URL + credit, 40 per request. */
async function commonsImages(files: string[], width: number): Promise<Map<string, MediaImage>> {
  const out = new Map<string, MediaImage>();
  const unique = [...new Set(files)];
  for (let i = 0; i < unique.length; i += 40) {
    const chunk = unique.slice(i, i + 40);
    const j = await getJson<{ query?: { normalized?: { from: string; to: string }[]; pages: Record<string, { title: string; imageinfo?: ImageInfo[] }> } }>(
      api("commons.wikimedia.org", {
        action: "query",
        prop: "imageinfo",
        iiprop: "url|extmetadata",
        iiextmetadatafilter: "Artist|LicenseShortName|Credit",
        iiurlwidth: String(width),
        titles: chunk.map((f) => `File:${f}`).join("|"),
      }),
    );
    const norm = new Map((j.query?.normalized ?? []).map((n) => [n.to, n.from]));
    for (const p of Object.values(j.query?.pages ?? {})) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      const requested = (norm.get(p.title) ?? p.title).replace(/^File:/, "");
      const artist = stripHtml(ii.extmetadata?.Artist?.value).slice(0, 120);
      const license = stripHtml(ii.extmetadata?.LicenseShortName?.value);
      out.set(requested, {
        url: cleanUrl(ii.thumburl),
        width: ii.thumbwidth,
        height: ii.thumbheight,
        credit: [artist, license].filter(Boolean).join(" · ") || "Wikimedia Commons",
        source: ii.descriptionurl,
      });
    }
  }
  return out;
}

/* ───────── Wikidata ───────── */
interface Snak { datavalue?: { value: unknown } }
interface Statement { mainsnak: Snak; rank: "preferred" | "normal" | "deprecated"; qualifiers?: Record<string, Snak[]> }
interface Entity {
  id: string;
  labels?: { en?: { value: string }; mul?: { value: string } };
  aliases?: { en?: { value: string }[]; mul?: { value: string }[] };
  descriptions?: { en?: { value: string } };
  claims?: Record<string, Statement[]>;
  sitelinks?: { enwiki?: { title: string } };
}

const ids = (e: Entity, prop: string) => (e.claims?.[prop] ?? []).map((s) => (s.mainsnak.datavalue?.value as { id?: string } | undefined)?.id).filter(Boolean) as string[];
const str = (e: Entity, prop: string) => (e.claims?.[prop] ?? []).filter((s) => s.rank !== "deprecated").map((s) => s.mainsnak.datavalue?.value).find((v) => typeof v === "string") as string | undefined;

/** English label, falling back to the language-neutral ("mul") label many company items now use. */
const label = (e: Entity) => e.labels?.en?.value ?? e.labels?.mul?.value;

async function entities(list: string[]): Promise<Map<string, Entity>> {
  const out = new Map<string, Entity>();
  const fetchBatch = async (batch: string[]) => {
    const j = await getJson<{ entities?: Record<string, Entity> }>(
      api("www.wikidata.org", { action: "wbgetentities", ids: batch.join("|"), props: "labels|aliases|descriptions|claims|sitelinks", languages: "en|mul", languagefallback: "1", sitefilter: "enwiki" }),
    );
    for (const e of Object.values(j.entities ?? {})) if (e.id && !("missing" in e)) out.set(e.id, e);
  };
  let pending = [...new Set(list)];
  // big company items make large responses that sometimes come back partial: retry what's missing in smaller batches
  for (const size of [50, 10, 1]) {
    for (let i = 0; i < pending.length; i += size) await fetchBatch(pending.slice(i, i + size));
    pending = pending.filter((id) => !out.has(id));
    if (!pending.length) break;
  }
  if (pending.length) console.log(`    (Wikidata didn't return: ${pending.join(", ")})`);
  return out;
}

/* ───────── Wikipedia fallbacks (infobox key people, free page images) ───────── */
interface WpPage { title: string; missing?: boolean; pageimage?: string; revisions?: { slots: { main: { "*"?: string; content?: string } } }[] }
async function wpPages(titles: string[], params: Record<string, string>): Promise<Map<string, WpPage>> {
  const out = new Map<string, WpPage>();
  const unique = [...new Set(titles)];
  const size = params.prop?.includes("revisions") ? 10 : 50; // content fetches return big pages
  for (let i = 0; i < unique.length; i += size) {
    const chunk = unique.slice(i, i + size);
    const j = await getJson<{ query?: { normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[]; pages: Record<string, WpPage> } }>(
      api("en.wikipedia.org", { action: "query", redirects: "1", titles: chunk.join("|"), ...params }),
    );
    const back = new Map<string, string>();
    for (const n of [...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])]) back.set(n.to, back.get(n.from) ?? n.from);
    for (const p of Object.values(j.query?.pages ?? {})) if (!p.missing) out.set(back.get(p.title) ?? p.title, p);
  }
  return out;
}

const CEO_RX = /\bCEO\b|chief executive/i;
const HEAD_ORDER: [RegExp, string][] = [
  [/\bpresident\b/i, "President"],
  [/studio head|head of studio|studio director/i, "Studio head"],
  [/managing director/i, "Managing director"],
  [/general manager/i, "General manager"],
  [/\bhead\b/i, "Head"],
];
const ROLE_HINT = /\b(?:ceo|coo|president|chair\w*|manager|director|head|officer|founder|executive)s?\b/i;
/** a "name" that is really a job title (e.g. a role link split onto its own line) */
const ROLE_WORD = /^(?:the\s+)?(?:co-?)?(?:ceo|coo|cfo|cto|president|vice[- ]president|chair(?:man|woman|person)?|director|managing director|studio director|studio head|head|founder|co-?founder|owner|executive|officer|manager|general manager|chief\b.*|representative\b.*|creative\b.*|senior\b.*)$/i;

/** Pull the CEO (else president / studio head) out of an infobox `key_people` field. */
export function leaderFromInfobox(wikitext: string): { name: string; article?: string; role: string } | undefined {
  const m = /\|\s*key_people\s*=([\s\S]*?)(?=\n\s*\|\s*[a-z_0-9]+\s*=|\n\}\})/i.exec(wikitext);
  if (!m) return undefined;
  // unwrap links first, remembering which display text pointed at which article ("[[A|B]]" → "B", B ↦ A)
  const linkTarget = new Map<string, string>();
  const body = m[1]
    .replace(/<ref[^>]*\/>|<ref[\s\S]*?<\/ref>|\{\{(?:efn|refn|sfn|citation needed)[^}]*\}\}/gi, "")
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, target: string, display?: string) => {
      const text = (display ?? target).trim();
      linkTarget.set(text, target.trim());
      return text;
    })
    .replace(/\{\{\s*(?:small|nowrap)\s*\|([^{}]*)\}\}/gi, "$1")
    .replace(/'''?|&nbsp;/g, " ")
    // "Name<br>(CEO)" / "Name\n(CEO)": keep the role on the same item as the name
    .replace(/(?:<br\s*\/?>|\n)\s*(?=\()/gi, " ");
  // items are separated by line breaks, bullets, or the pipes of {{Unbulleted list|…|…}} / {{Plainlist}}
  const items = body
    .split(/<br\s*\/?>|\n|\||\{\{|\}\}/i)
    .map((s) => s.replace(/^\s*\*\s*/, "").replace(/<[^>]+>/g, "").trim())
    .filter((s) => s && !/^(?:ubl|unbulleted list|plainlist|plain list|flatlist|nowrap|class\s*=|style\s*=)/i.test(s));
  // "[[Name]]|(president)": a role given as its own list item belongs to the item before it
  const merged: string[] = [];
  for (const it of items) {
    if (it.startsWith("(") && merged.length) merged[merged.length - 1] += ` ${it}`;
    else merged.push(it);
  }
  // "'''Executive General Manager'''|Name|…": a bare title acts as a heading for the names after it
  let heading = "";
  const people = merged.flatMap((it) => {
    if (!it.includes("(") && ROLE_HINT.test(it)) {
      heading = it;
      return [];
    }
    const name = it.split(/\s*\(|\s*,\s*|\s*:\s*|\s+[–—-]\s+/)[0].trim();
    const role = it.slice(name.length).trim() || heading;
    if (!name || name.length > 60 || /^[\W\d]/.test(name) || ROLE_WORD.test(name) || name.split(/\s+/).length > 5) return [];
    return [{ name, article: linkTarget.get(name), role }];
  });
  const ceo = people.find((p) => CEO_RX.test(p.role));
  if (ceo) return { name: ceo.name, article: ceo.article, role: "CEO" };
  // otherwise the most senior title: president, then studio head, then managing director, …
  for (const [rx, title] of HEAD_ORDER) {
    const head = people.find((p) => rx.test(p.role) && !/\bvice[- ]?president|\bart director|creative director|game director|technical director/i.test(p.role));
    if (head) return { name: head.name, article: head.article, role: title };
  }
  return undefined;
}

async function searchIds(name: string, attempt = 0): Promise<string[]> {
  const j = await getJson<{ search?: { id: string }[]; error?: { code: string; info: string } }>(api("www.wikidata.org", { action: "wbsearchentities", search: name, language: "en", type: "item", limit: "7" }));
  if (j.search) return j.search.map((s) => s.id);
  // API-level errors (e.g. maxlag / ratelimited) come back as HTTP 200 with an `error` body
  if (attempt < 4) {
    console.log(`    (search "${name}" failed: ${j.error?.code ?? "no results"}; retrying)`);
    await sleep(10_000 * (attempt + 1));
    return searchIds(name, attempt + 1);
  }
  console.log(`    (search "${name}" gave up: ${j.error?.info ?? "unknown error"})`);
  return [];
}

const GAME_TYPES = new Set(["Q210167", "Q1137109"]); // video game developer, video game publisher
const GAME_INDUSTRY = "Q941594"; // video game industry
const HUMAN = "Q5";
const COMPANYISH = /video ?game|game (developer|publisher|studio|company)|games? (developer|publisher)|interactive|entertainment|software|developer|publisher|studio|company|corporation|conglomerate|subsidiary|holding|division|label|brand/i;

function scoreCandidate(e: Entity, want: string): number {
  const names = [label(e), ...[...(e.aliases?.en ?? []), ...(e.aliases?.mul ?? [])].map((a) => a.value)].filter(Boolean).map((n) => normTitle(n!));
  const exact = names.includes(want);
  const loose = names.some((n) => n.replace(/\b(inc|ltd|llc|co|corporation|games|studios?|entertainment|interactive|software)\b/g, "").trim() === want.replace(/\b(inc|ltd|llc|co|corporation|games|studios?|entertainment|interactive|software)\b/g, "").trim());
  if (!exact && !loose) return -1;
  const desc = e.descriptions?.en?.value ?? "";
  const p31 = ids(e, "P31");
  const typed = p31.some((q) => GAME_TYPES.has(q)) || ids(e, "P452").includes(GAME_INDUSTRY);
  const gameDesc = /video ?game|games? (developer|publisher|studio|company)|game develop/i.test(desc);
  // must be a games company (by type, industry or description): rules out e.g. "Colossal Order" → an architectural order
  if (!typed && !gameDesc && !(COMPANYISH.test(desc) && /game|interactive/i.test(want))) return -1;
  let s = exact ? 3 : 1;
  if (typed) s += 4;
  if (gameDesc) s += 3;
  else if (COMPANYISH.test(desc)) s += 1;
  if (p31.includes(HUMAN)) s += /game/i.test(desc) ? 1 : -10;
  if (e.sitelinks?.enwiki) s += 1;
  if (str(e, "P154")) s += 1;
  return s;
}

/** The current holder of a role: not ended, preferred rank first, then the latest start date. */
function currentHolder(e: Entity, prop: string): string | undefined {
  const time = (st: Statement, q: string) => (st.qualifiers?.[q]?.[0]?.datavalue?.value as { time?: string } | undefined)?.time ?? "";
  const live = (e.claims?.[prop] ?? []).filter((st) => st.rank !== "deprecated" && !st.qualifiers?.P582 && (st.mainsnak.datavalue?.value as { id?: string } | undefined)?.id);
  live.sort((a, b) => (a.rank === b.rank ? time(b, "P580").localeCompare(time(a, "P580")) : a.rank === "preferred" ? -1 : 1));
  return (live[0]?.mainsnak.datavalue?.value as { id: string } | undefined)?.id;
}

async function main() {
  const existing: MediaFile = (() => {
    try {
      return JSON.parse(readFileSync(OUT, "utf8")) as MediaFile;
    } catch {
      return { platforms: {}, studios: {} };
    }
  })();
  const result: MediaFile = { platforms: { ...existing.platforms }, studios: { ...existing.studios } };

  /* Platforms */
  const pTodo = platforms.filter((p) => PLATFORM_FILES[p.slug] && !existing.platforms[p.slug]?.manual && (FORCE || !existing.platforms[p.slug]));
  if (pTodo.length) {
    console.log(`Platforms · ${pTodo.length} to fetch`);
    const imgs = await commonsImages(pTodo.map((p) => PLATFORM_FILES[p.slug]), 1000);
    for (const p of pTodo) {
      const img = imgs.get(PLATFORM_FILES[p.slug]);
      if (img) {
        result.platforms[p.slug] = { ...img, ...(PLATFORM_CAPTIONS[p.slug] ? { caption: PLATFORM_CAPTIONS[p.slug] } : {}) };
        console.log(`  ✓ ${p.short}`);
      } else console.log(`  · ${p.short}: Commons file not found (${PLATFORM_FILES[p.slug]})`);
    }
  }

  /* Studios */
  const all = mergeStudios(curated, allSeedGames, studioNames).sort((a, b) => a.name.localeCompare(b.name));
  const sTodo = all.filter((s) => !existing.studios[s.slug]?.manual && (FORCE || !existing.studios[s.slug]) && STUDIO_OVERRIDES[s.slug] !== null);
  console.log(`\nStudios · ${all.length} total · ${sTodo.length} to look up`);

  // 1) search every name, 2) fetch all candidates in batches of 50 — far fewer requests than one fetch per studio
  const candIds = new Map<string, string[]>();
  for (const [i, s] of sTodo.entries()) {
    const override = STUDIO_OVERRIDES[s.slug];
    candIds.set(s.slug, override ? [override] : await searchIds(s.name));
    if ((i + 1) % 25 === 0) console.log(`  searched ${i + 1}/${sTodo.length}`);
  }
  const cands = await entities([...candIds.values()].flat());

  const picked = new Map<string, Entity>();
  const unmatched: string[] = [];
  for (const [i, s] of sTodo.entries()) {
    const tag = `[${i + 1}/${sTodo.length}]`;
    const list = (candIds.get(s.slug) ?? []).map((id) => cands.get(id)).filter(Boolean) as Entity[];
    let best: Entity | undefined;
    if (STUDIO_OVERRIDES[s.slug]) best = list[0];
    else {
      const want = normTitle(s.name);
      const scored = list.map((e) => ({ e, sc: scoreCandidate(e, want) })).filter((x) => x.sc >= 4).sort((a, b) => b.sc - a.sc);
      best = scored[0]?.e;
    }
    if (best) {
      picked.set(s.slug, best);
      console.log(`  ✓ ${tag} ${s.name} → ${label(best)} (${best.id}: ${best.descriptions?.en?.value ?? "no description"})`);
    } else {
      unmatched.push(`${s.slug}  (${s.name})`);
      console.log(`  · ${tag} ${s.name} → no confident match`);
    }
  }

  const isPerson = (e: Entity) => ids(e, "P31").includes(HUMAN); // a solo developer: the person *is* the studio
  const enwiki = (e: Entity) => e.sitelinks?.enwiki?.title;
  const wpUrl = (title: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

  // leaders: Wikidata CEO (P169) → director/manager (P1037) → English Wikipedia infobox `key_people`
  type Leader = { name?: string; id?: string; article?: string; role: string; source: "wikidata" | "wikipedia" };
  const leaderOf = new Map<string, Leader>();
  for (const [slug, e] of picked) {
    if (isPerson(e) || IGNORE_WIKIDATA_LEADER.has(slug)) continue;
    const ceo = currentHolder(e, "P169");
    const head = ceo ? undefined : currentHolder(e, "P1037");
    if (ceo || head) leaderOf.set(slug, { id: (ceo ?? head)!, role: ceo ? "CEO" : "Studio head", source: "wikidata" });
  }
  const people = await entities([...leaderOf.values()].map((l) => l.id!));
  for (const [slug, l] of leaderOf) {
    const p = people.get(l.id!);
    if (p && label(p)) Object.assign(l, { name: label(p), article: enwiki(p) });
    else leaderOf.delete(slug);
  }
  const needInfobox = [...picked].filter(([slug, e]) => !isPerson(e) && !leaderOf.has(slug) && enwiki(e));
  console.log(`\nReading Wikipedia infoboxes for ${needInfobox.length} studios without a CEO on Wikidata…`);
  const boxes = await wpPages(needInfobox.map(([, e]) => enwiki(e)!), { prop: "revisions", rvprop: "content", rvslots: "main" });
  for (const [slug, e] of needInfobox) {
    const rev = boxes.get(enwiki(e)!)?.revisions?.[0]?.slots.main;
    const found = leaderFromInfobox(rev?.["*"] ?? rev?.content ?? "");
    if (found) leaderOf.set(slug, { ...found, source: "wikipedia" });
  }

  // images: Wikidata files first, then free (Commons) page images from English Wikipedia
  const logoFiles = new Map<string, string>();
  const photoFiles = new Map<string, string>();
  for (const [slug, e] of picked) {
    if (isPerson(e)) {
      const f = str(e, "P18");
      if (f) photoFiles.set(`self:${slug}`, f);
    } else {
      const f = str(e, "P154");
      if (f) logoFiles.set(slug, f);
    }
    const l = leaderOf.get(slug);
    const pf = l?.id && people.get(l.id) ? str(people.get(l.id)!, "P18") : undefined;
    if (pf) photoFiles.set(slug, pf);
  }
  const pageImageTitles = [
    ...[...picked].filter(([slug, e]) => !isPerson(e) && !logoFiles.has(slug) && enwiki(e)).map(([, e]) => enwiki(e)!),
    ...[...leaderOf].filter(([slug, l]) => !photoFiles.has(slug) && l.article).map(([, l]) => l.article!),
  ];
  const pageImages = await wpPages(pageImageTitles, { prop: "pageimages", piprop: "name", pilicense: "free" });
  for (const [slug, e] of picked) {
    const f = enwiki(e) && !logoFiles.has(slug) && !isPerson(e) ? pageImages.get(enwiki(e)!)?.pageimage : undefined;
    if (f && /logo|wordmark/i.test(f)) logoFiles.set(slug, f.replace(/_/g, " "));
    const l = leaderOf.get(slug);
    const pf = l?.article && !photoFiles.has(slug) ? pageImages.get(l.article)?.pageimage : undefined;
    if (pf && !/logo|\.svg$/i.test(pf)) photoFiles.set(slug, pf.replace(/_/g, " "));
  }
  const logos = await commonsImages([...logoFiles.values()], 320);
  const photos = await commonsImages([...photoFiles.values()], 320);

  for (const [slug, e] of picked) {
    const entry: StudioMedia = { wikidata: e.id };
    if (enwiki(e)) entry.wikipedia = wpUrl(enwiki(e)!);
    if (isPerson(e)) {
      entry.person = { name: label(e) ?? "", photo: photoFiles.has(`self:${slug}`) ? photos.get(photoFiles.get(`self:${slug}`)!) : undefined };
    } else {
      const logo = logoFiles.has(slug) ? logos.get(logoFiles.get(slug)!) : undefined;
      if (logo) entry.logo = logo;
      const l = leaderOf.get(slug);
      if (l?.name) {
        entry.leader = { name: l.name, role: l.role, source: l.source };
        if (l.id) entry.leader.wikidata = l.id;
        if (l.article) entry.leader.wikipedia = wpUrl(l.article);
        const photo = photoFiles.has(slug) ? photos.get(photoFiles.get(slug)!) : undefined;
        if (photo) entry.leader.photo = photo;
      }
    }
    result.studios[slug] = entry;
  }
  for (const [slug, e] of picked) {
    const x = result.studios[slug];
    console.log(`  ${label(e)}: ${x.logo ? "logo" : "—"} · ${x.leader ? `${x.leader.role} ${x.leader.name} (${x.leader.source}${x.leader.photo ? ", photo" : ""})` : x.person ? `person${x.person.photo ? ", photo" : ""}` : "no leader"}`);
  }

  const st = Object.values(result.studios);
  console.log(
    `\nStudios matched: ${picked.size}/${sTodo.length} · with logo: ${st.filter((x) => x.logo).length} · with CEO/head: ${st.filter((x) => x.leader).length} (photo: ${st.filter((x) => x.leader?.photo).length})`,
  );
  if (unmatched.length) console.log(`No confident Wikidata match (they keep their monogram):\n${unmatched.map((u) => `  - ${u}`).join("\n")}`);

  if (!DRY) {
    const sort = <T>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(OUT, JSON.stringify({ platforms: sort(result.platforms), studios: sort(result.studios) }, null, 2) + "\n");
    console.log(`Wrote ${path.relative(process.cwd(), OUT)}. Restart the dev server (or rebuild) to show the changes.`);
  }
}

if (process.argv[1]?.includes("sync-media")) main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
