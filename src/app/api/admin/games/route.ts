import { mutateStore } from "@/lib/db";
import { validateGame } from "@/lib/validate";
import { adminHandler } from "../_shared";

export async function POST(req: Request) {
  return adminHandler(req, async () => {
    const game = validateGame(await req.json());
    await mutateStore((s) => {
      s.gameEdits[game.slug] = game;
      s.deletedGames = s.deletedGames.filter((x) => x !== game.slug);
    });
    return game.slug;
  });
}

export async function DELETE(req: Request) {
  return adminHandler(req, async () => {
    const slug = new URL(req.url).searchParams.get("slug");
    if (!slug) throw new Error("slug required");
    await mutateStore((s) => {
      delete s.gameEdits[slug];
      if (!s.deletedGames.includes(slug)) s.deletedGames.push(slug);
    });
  });
}
