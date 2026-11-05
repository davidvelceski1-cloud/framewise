"use client";

import { useEffect, useRef, useState } from "react";
import { platformById, modeLabels } from "@/lib/platforms";
import type { PerformanceTest } from "@/lib/types";

/**
 * Draws a procedural night-city scene at the platform's internal render height
 * (scaled to the canvas), then lets the browser upscale it — so lower internal
 * resolutions genuinely look softer. RT adds sharp reflections; quality tier
 * controls detail density. This is a simulation, not a captured screenshot.
 */
function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: PerformanceTest) {
  const s = w / 1280; // scale factor relative to reference width
  const detail = { Low: 0.45, Medium: 0.7, High: 0.9, Ultra: 1 }[t.quality];
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.74);
  sky.addColorStop(0, "#0B1023");
  sky.addColorStop(0.6, "#2A2346");
  sky.addColorStop(1, "#C97B5A");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // stars
  ctx.fillStyle = "rgba(255,255,255,.8)";
  for (let i = 0; i < 140 * detail; i++) ctx.fillRect(rnd() * w, rnd() * h * 0.4, 1.2 * s, 1.2 * s);
  // moon
  ctx.fillStyle = "#F4E9D2";
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.16, 34 * s, 0, Math.PI * 2);
  ctx.fill();
  // mountains
  ctx.fillStyle = "#3B2C4C";
  ctx.beginPath();
  ctx.moveTo(0, h * 0.6);
  for (let x = 0; x <= 1; x += 0.05) ctx.lineTo(x * w, h * (0.52 + Math.sin(x * 9) * 0.04 + Math.sin(x * 23) * 0.015));
  ctx.lineTo(w, h * 0.74);
  ctx.lineTo(0, h * 0.74);
  ctx.fill();

  // buildings
  const horizon = h * 0.74;
  const buildings: { x: number; bw: number; bh: number; c: string }[] = [];
  let x = -10 * s;
  seed = 42;
  while (x < w) {
    const bw = (50 + rnd() * 90) * s;
    const bh = (120 + rnd() * 260) * s;
    buildings.push({ x, bw, bh, c: ["#141428", "#1B1A33", "#221F3D"][Math.floor(rnd() * 3)] });
    x += bw + 4 * s;
  }
  const drawCity = (mirror: boolean) => {
    for (const b of buildings) {
      const top = mirror ? horizon : horizon - b.bh;
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x, top, b.bw, b.bh);
      // windows (fine detail that aliases at low res)
      for (let wy = 10 * s; wy < b.bh - 12 * s; wy += 14 * s) {
        for (let wx = 8 * s; wx < b.bw - 8 * s; wx += 12 * s) {
          if (rnd() > 0.55 * (2 - detail)) continue;
          ctx.fillStyle = rnd() > 0.5 ? "#F7D58B" : "#9AD4FF";
          const yy = mirror ? horizon + wy : top + wy;
          ctx.fillRect(b.x + wx, yy, 5 * s, 7 * s);
        }
      }
    }
    // neon signs
    const neon = [
      { x: 0.18, y: 0.38, c: "#FF4FA3", t: "FRAMEWISE" },
      { x: 0.55, y: 0.33, c: "#3BE3FF", t: "60 FPS" },
      { x: 0.76, y: 0.42, c: "#C9A96E", t: "4K" },
    ];
    for (const n of neon) {
      const nx = n.x * w;
      const ny = mirror ? horizon + (horizon - n.y * h) : n.y * h;
      ctx.save();
      ctx.shadowColor = n.c;
      ctx.shadowBlur = 18 * s;
      ctx.fillStyle = n.c;
      ctx.font = `600 ${22 * s}px ui-sans-serif, system-ui`;
      ctx.fillText(n.t, nx, ny);
      ctx.restore();
    }
  };
  seed = 7;
  drawCity(false);

  // power lines (thin geometry → shimmer/aliasing at low res)
  ctx.strokeStyle = "rgba(10,10,20,.9)";
  ctx.lineWidth = Math.max(0.6, 1.1 * s);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, h * (0.2 + i * 0.03));
    ctx.quadraticCurveTo(w * 0.5, h * (0.3 + i * 0.03), w, h * (0.18 + i * 0.03));
    ctx.stroke();
  }

  // wet street
  const ground = ctx.createLinearGradient(0, horizon, 0, h);
  ground.addColorStop(0, "#14121F");
  ground.addColorStop(1, "#07070C");
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon, w, h - horizon);

  // reflections
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, horizon, w, h - horizon);
  ctx.clip();
  if (t.rayTracing) {
    ctx.globalAlpha = 0.55;
    seed = 7;
    drawCity(true);
    ctx.globalAlpha = 1;
  } else {
    // screen-space style: blurry, partial, fades out
    ctx.globalAlpha = 0.18;
    ctx.filter = `blur(${6 * s}px)`;
    seed = 7;
    drawCity(true);
    ctx.filter = "none";
    ctx.globalAlpha = 1;
  }
  const fade = ctx.createLinearGradient(0, horizon, 0, h);
  fade.addColorStop(0, "rgba(7,7,12,0)");
  fade.addColorStop(1, "rgba(7,7,12,.85)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, horizon, w, h - horizon);
  ctx.restore();

  // road markings
  ctx.fillStyle = "rgba(233,216,180,.55)";
  for (let i = 0; i < 9; i++) {
    const yy = horizon + (h - horizon) * (0.25 + i * 0.09);
    ctx.fillRect(w * 0.5 - (2 + i) * s, yy, (4 + i * 2) * s, (6 + i * 3) * s);
  }
}

function SceneCanvas({ test, className }: { test: PerformanceTest; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    // internal width proportional to native render height (2160p → 1280px reference)
    const w = Math.max(160, Math.round((test.nativePixels / 2160) * 1280));
    const h = Math.round(w * 9 / 16);
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (ctx) drawScene(ctx, w, h, test);
  }, [test]);
  return <canvas ref={ref} className={className} style={{ imageRendering: "auto" }} aria-hidden />;
}

function Select({ v, set, label, tests }: { v: number; set: (n: number) => void; label: string; tests: PerformanceTest[] }) {
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span className="text-muted">{label}</span>
      <select value={v} onChange={(e) => set(Number(e.target.value))} className="hairline h-9 rounded-full bg-card px-3 text-[13px]">
        {tests.map((t, i) => (
          <option key={t.id} value={i}>{platformById[t.platform].short} · {modeLabels[t.mode]}</option>
        ))}
      </select>
    </label>
  );
}

export function ImageCompare({ tests }: { tests: PerformanceTest[] }) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(Math.min(1, tests.length - 1));
  const [pos, setPos] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  if (tests.length < 2) return <p className="text-sm text-muted">Select at least two platforms to compare image quality.</p>;
  const L = tests[Math.min(a, tests.length - 1)];
  const R = tests[Math.min(b, tests.length - 1)];

  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <Select v={a} set={setA} label="Left" tests={tests} />
        <Select v={b} set={setB} label="Right" tests={tests} />
      </div>
      <div
        ref={box}
        className="relative aspect-video w-full cursor-ew-resize select-none overflow-hidden rounded-2xl bg-black"
        onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e.clientX); }}
        onPointerMove={(e) => dragging.current && move(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
      >
        <SceneCanvas test={L} className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <SceneCanvas test={R} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 w-px bg-white/90" style={{ left: `${pos}%` }}>
          <div className="glass absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-xs text-ink shadow-lift">⇆</div>
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] text-white backdrop-blur">{platformById[L.platform].short} · {L.nativeRes}{L.rayTracing ? " · RT" : ""}</span>
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11.5px] text-white backdrop-blur">{platformById[R.platform].short} · {R.nativeRes}{R.rayTracing ? " · RT" : ""}</span>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="mt-3 w-full accent-[var(--gold)]" aria-label="Comparison slider position" />
      <p className="mt-1 text-[11.5px] text-muted">Simulated illustration: rendered at each platform&apos;s internal resolution with its RT setting. Not an in-game screenshot.</p>
    </div>
  );
}
