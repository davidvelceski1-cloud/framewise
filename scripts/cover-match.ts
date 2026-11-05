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
    .trim();

/** "God of War (2018)" → search "God of War", prefer 2018. */
export function queryFor(title: string, releaseDate: string) {
  const m = /^(.*) \((\d{4})\)$/.exec(title);
  return { name: m ? m[1] : title, year: m ? Number(m[2]) : Number(releaseDate.slice(0, 4)) };
}

export function pickBest(title: string, releaseDate: string, candidates: IgdbCandidate[]) {
  const { name, year } = queryFor(title, releaseDate);
  const want = normTitle(name);
  const scored = candidates
    .filter((c) => c.cover?.image_id)
    .map((c) => {
      const n = normTitle(c.name);
      const y = c.first_release_date ? new Date(c.first_release_date * 1000).getUTCFullYear() : undefined;
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
