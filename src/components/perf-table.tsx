import { modeLabels, platformById } from "@/lib/platforms";
import type { PerformanceTest } from "@/lib/types";
import { PlatformBadge, SourceBadge } from "./ui";
import { fmtFps } from "@/lib/utils";

export function PerfTable({ tests }: { tests: PerformanceTest[] }) {
  const order = Object.keys(platformById);
  const sorted = [...tests].sort((a, b) => order.indexOf(a.platform) - order.indexOf(b.platform) || a.mode.localeCompare(b.mode));
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-[13px]">
        <caption className="sr-only">Performance entries by platform and mode</caption>
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-[0.12em] text-muted">
            {["Platform", "Mode", "Target", "Avg", "1% low", "Resolution", "Upscaler", "Quality", "RT", "Load", "Patch", "Source"].map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((t) => (
            <tr key={t.id} className="border-b border-line last:border-0 hover:bg-surface/60">
              <td className="px-4 py-3"><PlatformBadge id={t.platform} size="xs" /></td>
              <td className="px-4 py-3">{modeLabels[t.mode]}</td>
              <td className="tabular px-4 py-3 text-muted">{t.targetFps ?? "—"}</td>
              <td className="tabular px-4 py-3 font-medium">{fmtFps(t.fpsAvg)}</td>
              <td className="tabular px-4 py-3 text-muted">{fmtFps(t.fps1Low)}</td>
              <td className="tabular px-4 py-3">{t.nativeRes} <span className="text-muted">→ {t.outputRes}</span></td>
              <td className="px-4 py-3 text-muted">{t.upscaler}</td>
              <td className="px-4 py-3">{t.quality}</td>
              <td className="px-4 py-3">{t.rayTracing ? "Yes" : "No"}</td>
              <td className="tabular px-4 py-3">{t.loadSec}s</td>
              <td className="tabular px-4 py-3 text-muted">{t.patchVersion}</td>
              <td className="px-4 py-3">
                {t.source.url ? (
                  <a href={t.source.url} target="_blank" rel="noreferrer noopener"><SourceBadge {...t} label={t.source.label} /></a>
                ) : (
                  <SourceBadge {...t} label={t.source.label} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
