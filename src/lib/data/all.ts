import { seedGames } from "./games";
import { requirements as curatedRequirements } from "./requirements";
import { studios as curatedStudios } from "./studios";
import { extendedStudioNames, mergeStudios, parseExtended } from "./expand";
import { coverUrlFor, heroUrlFor, logoUrlFor } from "./covers";

/** The full seed catalog: 18 curated games + the extended list (deduplicated by slug). */
const extended = parseExtended();
const curatedSlugs = new Set(seedGames.map((g) => g.slug));

// Real cover art (from `npm run covers:sync`) is attached here; games without one keep generated art.
export const allSeedGames = [...seedGames, ...extended.games.filter((g) => !curatedSlugs.has(g.slug))].map((g) => {
  const coverUrl = coverUrlFor(g.slug);
  const heroUrl = heroUrlFor(g.slug);
  const logoUrl = logoUrlFor(g.slug);
  return { ...g, ...(coverUrl && { coverUrl }), ...(heroUrl && { heroUrl }), ...(logoUrl && { logoUrl }) };
});
export const allRequirements = [...curatedRequirements, ...extended.requirements.filter((r) => !curatedSlugs.has(r.gameSlug))];
export const studioNames = extendedStudioNames();
export const allStudios = mergeStudios(curatedStudios, allSeedGames, studioNames);
