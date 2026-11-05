"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMounted } from "@/lib/hooks";
import { axisScores } from "@/lib/analysis";
import { modeLabels, platformById } from "@/lib/platforms";
import type { PerformanceTest } from "@/lib/types";

const axisStyle = { fontSize: 11.5, fill: "var(--muted)" };

function ChartTooltip({ active, payload, label, unit = "" }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass hairline rounded-xl px-3 py-2 text-xs shadow-soft">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}</span>
          <span className="tabular ml-auto pl-3">{typeof p.value === "number" ? p.value.toFixed(1) : p.value}{unit}</span>
        </p>
      ))}
    </div>
  );
}

// Recharts measures the DOM, so charts render after mount (useMounted).

/* Grouped bar: avg vs 1% low per platform */
export function FpsBarChart({ tests, height = 300 }: { tests: PerformanceTest[]; height?: number }) {
  const mounted = useMounted();
  const data = tests.map((t) => ({
    name: platformById[t.platform].short,
    mode: modeLabels[t.mode],
    avg: t.fpsAvg,
    low: t.fps1Low,
    color: platformById[t.platform].chart,
  }));
  if (!mounted) return <div style={{ height }} className="shimmer rounded-2xl" />;
  return (
    <div style={{ height }} role="img" aria-label={`Bar chart of average and 1% low fps: ${data.map((d) => `${d.name} ${d.avg} fps`).join(", ")}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
          <ReferenceLine y={60} stroke="var(--gold)" strokeDasharray="4 4" label={{ value: "60", position: "right", fill: "var(--gold-ink)", fontSize: 10 }} />
          <ReferenceLine y={30} stroke="var(--line-strong)" strokeDasharray="4 4" />
          <Tooltip cursor={{ fill: "var(--surface)", radius: 8 }} content={<ChartTooltip unit=" fps" />} />
          <Bar dataKey="avg" name="Average" radius={[8, 8, 3, 3]} maxBarSize={44}
            shape={(props: unknown) => {
              const p = props as { x: number; y: number; width: number; height: number; payload: { color: string } };
              return <rect x={p.x} y={p.y} width={p.width} height={Math.max(p.height, 0)} rx={7} fill={p.payload.color} />;
            }}
          />
          <Bar dataKey="low" name="1% low" radius={[8, 8, 3, 3]} maxBarSize={44}
            shape={(props: unknown) => {
              const p = props as { x: number; y: number; width: number; height: number; payload: { color: string } };
              return <rect x={p.x} y={p.y} width={p.width} height={Math.max(p.height, 0)} rx={7} fill={p.payload.color} fillOpacity={0.35} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Deterministic frametime trace synthesised from avg + 1% low (labelled as simulated in UI). */
export function frametimeSeries(t: PerformanceTest, points = 90) {
  let seed = [...t.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const base = 1000 / t.fpsAvg;
  const spike = 1000 / t.fps1Low;
  return Array.from({ length: points }, (_, i) => {
    const r = rand();
    let ms = base * (0.96 + rand() * 0.08);
    if (r > 0.965) ms = spike * (0.95 + rand() * 0.15);
    else if (r > 0.9) ms = base + (spike - base) * rand() * 0.5;
    if (t.targetFps && ms < 1000 / t.targetFps) ms = 1000 / t.targetFps;
    return { i, ms: Math.round(ms * 10) / 10 };
  });
}

export function FrametimeChart({ tests, height = 260 }: { tests: PerformanceTest[]; height?: number }) {
  const mounted = useMounted();
  const series = tests.map((t) => ({ t, s: frametimeSeries(t) }));
  const data = series[0]?.s.map((_, i) => Object.fromEntries([["i", i], ...series.map(({ t, s }) => [t.platform, s[i].ms])])) ?? [];
  if (!mounted) return <div style={{ height }} className="shimmer rounded-2xl" />;
  return (
    <div style={{ height }} role="img" aria-label="Simulated frametime over a 90-second run for each selected platform">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line)" />
          <XAxis dataKey="i" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}s`} interval={14} />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} unit="ms" domain={[0, "auto"]} />
          <ReferenceLine y={16.7} stroke="var(--gold)" strokeDasharray="4 4" />
          <ReferenceLine y={33.3} stroke="var(--line-strong)" strokeDasharray="4 4" />
          <Tooltip content={<ChartTooltip unit=" ms" />} labelFormatter={(v) => `${v}s`} />
          {tests.map((t) => (
            <Line key={t.id} type="monotone" dataKey={t.platform} name={platformById[t.platform].short} stroke={platformById[t.platform].chart} strokeWidth={1.6} dot={false} isAnimationActive />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function QualityRadar({ tests, height = 300 }: { tests: PerformanceTest[]; height?: number }) {
  const mounted = useMounted();
  const axes = [
    ["frameRate", "Frame rate"],
    ["stability", "Stability"],
    ["resolution", "Resolution"],
    ["features", "Visual features"],
    ["loading", "Loading"],
  ] as const;
  const scored = tests.map((t) => ({ t, a: axisScores(t) }));
  const data = axes.map(([k, label]) => Object.fromEntries([["axis", label], ...scored.map(({ t, a }) => [t.platform, Math.round(a[k])])]));
  if (!mounted) return <div style={{ height }} className="shimmer rounded-2xl" />;
  return (
    <div style={{ height }} role="img" aria-label="Radar chart scoring each platform on frame rate, stability, resolution, visual features and loading">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--line-strong)" />
          <PolarAngleAxis dataKey="axis" tick={axisStyle} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          {tests.map((t) => (
            <Radar key={t.id} dataKey={t.platform} name={platformById[t.platform].short} stroke={platformById[t.platform].chart} fill={platformById[t.platform].chart} fillOpacity={0.08} strokeWidth={1.6} />
          ))}
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Tooltip content={<ChartTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* Compact horizontal snapshot used on game pages. */
export function FpsSnapshot({ tests }: { tests: PerformanceTest[] }) {
  const max = Math.max(60, ...tests.map((t) => t.fpsAvg));
  return (
    <ul className="space-y-3">
      {tests.map((t) => (
        <li key={t.id} className="grid grid-cols-[96px_1fr_64px] items-center gap-3 text-[13px]">
          <span className="truncate">{platformById[t.platform].short}</span>
          <span className="relative h-2.5 overflow-hidden rounded-full bg-surface">
            <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(t.fpsAvg / max) * 100}%`, background: platformById[t.platform].chart }} />
            <span className="absolute inset-y-0 w-px bg-gold" style={{ left: `${(60 / max) * 100}%` }} title="60 fps" />
          </span>
          <span className="tabular text-right">{t.fpsAvg.toFixed(0)} <span className="text-muted">fps</span></span>
        </li>
      ))}
    </ul>
  );
}
