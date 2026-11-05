import { getCatalog } from "@/lib/db";

/** Benchmark rows for one game — the comparator loads these on demand. */
export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("game");
  if (!slug || !/^[a-z0-9-]{1,120}$/.test(slug)) return Response.json({ error: "game required" }, { status: 400 });
  const cat = await getCatalog();
  if (!cat.games.some((g) => g.slug === slug)) return Response.json({ error: "unknown game" }, { status: 404 });
  return Response.json({ tests: cat.tests.filter((t) => t.gameSlug === slug) });
}
