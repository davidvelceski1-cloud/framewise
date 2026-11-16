/** Pure matching logic for the IGDB cover sync (kept separate so it can be tested offline). */

export interface IgdbCandidate {
  id: number;
  name: string;
  first_release_date?: number; // unix seconds
  cover?: { image_id: string };
}

export const normTitle = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    // "Baldur's Gate III" and "Baldur's Gate 3" compare equal (standalone numerals II–XX only)
    .replace(/\b(?=[ivx]{2,5}\b)(x{0,2})(ix|iv|v?i{0,3})\b/g, (m, tens: string, ones: string) => String(tens.length * 10 + ROMAN[ones]));

const ROMAN: Record<string, number> = { "": 0, i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 };

const EDITION = /:?\s*(?:the\s+)?(?:final cut|director'?s cut|definitive edition|game of the year edition|goty edition|complete edition|enhanced edition)$/i;
/** "Disco Elysium: The Final Cut" → "Disco Elysium" (some sources only list the base game); undefined when there's no edition suffix. */
export const baseTitle = (title: string) => (EDITION.test(title) ? title.replace(EDITION, "").trim() : undefined);

/** "God of War (2018)" → search "God of War", prefer 2018. */
export function queryFor(title: string, releaseDate: string) {
  const m = /^(.*) \((\d{4})\)$/.exec(title);
  return { name: m ? m[1] : title, year: m ? Number(m[2]) : Number(releaseDate.slice(0, 4)) };
}

export function pickBest(title: string, releaseDate: string, candidates: IgdbCandidate[]) {
  return pickBestBy(title, releaseDate, candidates.filter((c) => c.cover?.image_id), (c) => c.first_release_date);
}

/** Same matching rules for any source: `releaseSeconds` gives a candidate's unix release date, if known. */
export function pickBestBy<T extends { name: string }>(title: string, releaseDate: string, candidates: T[], releaseSeconds: (c: T) => number | undefined): T | null {
  const { name, year } = queryFor(title, releaseDate);
  const want = normTitle(name);
  const scored = candidates
    .map((c) => {
      const n = normTitle(c.name);
      const secs = releaseSeconds(c);
      const y = secs ? new Date(secs * 1000).getUTCFullYear() : undefined;
      let score = 0;
      if (n === want) score += 100;
      else if (n.startsWith(want) || want.startsWith(n)) score += 30;
      if (y !== undefined) score += y === year ? 25 : Math.abs(y - year) === 1 ? 12 : -5 * Math.abs(y - year);
      return { c, score, exact: n === want, yearOk: y !== undefined && Math.abs(y - year) <= 1 };
    })
    .sort((a, b) => b.score - a.score);
  const best = scored[0];
  // Accept only confident matches: exact title, or a near title with a matching release year.
  if (!best || !(best.exact || (best.score >= 40 && best.yearOk))) return null;
  return best.c;
}
