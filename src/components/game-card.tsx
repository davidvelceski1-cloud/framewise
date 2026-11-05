import Link from "next/link";
import { GameCover, PlatformBadge } from "./ui";
import type { Game, PerformanceTest } from "@/lib/types";
import { bestTestPerPlatform } from "@/lib/analysis";
import { modeLabels, platformById } from "@/lib/platforms";
import { fmtFps } from "@/lib/utils";

export function GameCard({ game, tests, evidence }: { game: Game; tests: PerformanceTest[]; evidence?: PerformanceTest }) {
  const best = bestTestPerPlatform(tests);
  const top = evidence ?? best[0];
  return (
    <Link href={`/games/${game.slug}`} className="card lift group block overflow-hidden p-2.5">
      <GameCover title={game.title} cover={game.cover} image={game.coverUrl} className="aspect-[4/3] w-full" />
      <div className="px-2 pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-[17px] font-semibold">{game.title}</h3>
            <p className="text-[13px] text-muted">
              {game.releaseDate.slice(0, 4)} · {game.genres.join(" · ")}
            </p>
          </div>
          {game.criticScore && (
            <span className="tabular hairline shrink-0 rounded-lg bg-surface px-2 py-1 text-xs" title="Approximate critic score">
              {game.criticScore}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {best.slice(0, 4).map((t) => (
            <PlatformBadge key={t.platform} id={t.platform} size="xs" />
          ))}
          {best.length > 4 && <span className="text-[11px] text-muted">+{best.length - 4}</span>}
        </div>
        {top && (
          <p className="mt-3 border-t border-line pt-3 text-[12.5px] text-muted">
            Best: <span className="text-ink">{platformById[top.platform].short}</span> ·{" "}
            <span className="tabular text-ink">{fmtFps(top.fpsAvg)} fps</span> · {modeLabels[top.mode]}
          </p>
        )}
      </div>
    </Link>
  );
}
