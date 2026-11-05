import type { PlatformFamily, PlatformId, ReleasePlatform } from "./types";

/**
 * platformTheme — the single place to add or restyle a platform.
 * Every badge, chart series, comparison column, filter chip and platform page
 * reads its colors from here. Add Mac / mobile / future consoles by extending
 * `families` and `platforms`.
 */
export interface FamilyTheme {
  id: PlatformFamily;
  name: string;
  primary: string;
  secondary: string;
  gradient: [string, string];
  /** AA-safe badge colors (text always shown, color is never the only signal) */
  badgeBg: string;
  badgeFg: string;
  /** soft tint used on platform page heroes over the ivory base */
  tint: string;
  treatment: string;
}

export const families: Record<PlatformFamily, FamilyTheme> = {
  xbox: {
    id: "xbox",
    name: "Xbox",
    primary: "#107C10",
    secondary: "#FFFFFF",
    gradient: ["#0E7A0D", "#3BB54A"],
    badgeBg: "#107C10",
    badgeFg: "#FFFFFF",
    tint: "rgba(16,124,16,0.10)",
    treatment: "green glow accent",
  },
  playstation: {
    id: "playstation",
    name: "PlayStation",
    primary: "#003791",
    secondary: "#FFFFFF",
    gradient: ["#00439C", "#0070D1"],
    badgeBg: "#003791",
    badgeFg: "#FFFFFF",
    tint: "rgba(0,112,209,0.10)",
    treatment: "crisp blue / white",
  },
  nintendo: {
    id: "nintendo",
    name: "Nintendo",
    primary: "#E60012",
    secondary: "#FFFFFF",
    gradient: ["#E60012", "#FF4554"],
    badgeBg: "#D10010",
    badgeFg: "#FFFFFF",
    tint: "rgba(230,0,18,0.08)",
    treatment: "playful red",
  },
  pc: {
    id: "pc",
    name: "PC",
    primary: "#1B1F27",
    secondary: "#C0C6D0",
    gradient: ["#1B1F27", "#8C94A3"],
    badgeBg: "#1B1F27",
    badgeFg: "#E6E9EE",
    tint: "rgba(140,148,163,0.16)",
    treatment: "graphite → brushed silver",
  },
  steamdeck: {
    id: "steamdeck",
    name: "Steam Deck",
    primary: "#1A9FFF",
    secondary: "#171D25",
    gradient: ["#171D25", "#1A9FFF"],
    badgeBg: "#171D25",
    badgeFg: "#FFFFFF",
    tint: "rgba(26,159,255,0.10)",
    treatment: "deep slate → Steam blue",
  },
};

export interface HardwareSpec {
  cpu: string;
  gpu: string;
  memory: string;
  storage: string;
  output: string;
  launched?: string;
}

export interface PlatformDef {
  id: PlatformId;
  slug: string;
  name: string;
  short: string;
  family: PlatformFamily;
  /** distinct series color within a family for charts */
  chart: string;
  /** relative GPU throughput, PS5 = 1 (used by demo-data generator) */
  power: number;
  outputHeight: number;
  hardware: HardwareSpec;
  blurb: string;
}

export const platforms: PlatformDef[] = [
  {
    id: "ps5",
    slug: "ps5",
    name: "PlayStation 5",
    short: "PS5",
    family: "playstation",
    chart: "#003791",
    power: 1,
    outputHeight: 2160,
    hardware: {
      cpu: "8-core AMD Zen 2 @ up to 3.5 GHz",
      gpu: "AMD RDNA 2 · 36 CUs · 10.28 TFLOPS",
      memory: "16 GB GDDR6",
      storage: "Custom NVMe SSD (825 GB / 1 TB)",
      output: "Up to 4K · 120 Hz · VRR · HDR",
      launched: "2020-11-12",
    },
    blurb: "The baseline for current-generation console performance.",
  },
  {
    id: "ps5-pro",
    slug: "ps5-pro",
    name: "PlayStation 5 Pro",
    short: "PS5 Pro",
    family: "playstation",
    chart: "#3B8FE0",
    power: 1.42,
    outputHeight: 2160,
    hardware: {
      cpu: "8-core AMD Zen 2 @ up to 3.85 GHz",
      gpu: "Upgraded AMD RDNA GPU · 60 CUs · 16.7 TFLOPS · PSSR",
      memory: "16 GB GDDR6 + 2 GB DDR5",
      storage: "2 TB NVMe SSD",
      output: "Up to 4K · 120 Hz · VRR · HDR",
      launched: "2024-11-07",
    },
    blurb: "Mid-generation refresh with PlayStation Spectral Super Resolution.",
  },
  {
    id: "xbox-series-x",
    slug: "xbox-series-x",
    name: "Xbox Series X",
    short: "Series X",
    family: "xbox",
    chart: "#107C10",
    power: 1.05,
    outputHeight: 2160,
    hardware: {
      cpu: "8-core AMD Zen 2 @ 3.8 GHz",
      gpu: "AMD RDNA 2 · 52 CUs · 12.15 TFLOPS",
      memory: "16 GB GDDR6",
      storage: "1 TB NVMe SSD",
      output: "Up to 4K · 120 Hz · VRR · HDR",
      launched: "2020-11-10",
    },
    blurb: "Microsoft's flagship console, tuned for native 4K output.",
  },
  {
    id: "xbox-series-s",
    slug: "xbox-series-s",
    name: "Xbox Series S",
    short: "Series S",
    family: "xbox",
    chart: "#5CC26A",
    power: 0.45,
    outputHeight: 1440,
    hardware: {
      cpu: "8-core AMD Zen 2 @ 3.6 GHz",
      gpu: "AMD RDNA 2 · 20 CUs · 4 TFLOPS",
      memory: "10 GB GDDR6",
      storage: "512 GB / 1 TB NVMe SSD",
      output: "Up to 1440p · 120 Hz · VRR · HDR",
      launched: "2020-11-10",
    },
    blurb: "The compact, all-digital current-gen Xbox targeting 1440p.",
  },
  {
    id: "switch",
    slug: "switch",
    name: "Nintendo Switch",
    short: "Switch",
    family: "nintendo",
    chart: "#E60012",
    power: 0.1,
    outputHeight: 1080,
    hardware: {
      cpu: "NVIDIA Tegra X1 · 4× ARM Cortex-A57",
      gpu: "NVIDIA Maxwell · 256 CUDA cores",
      memory: "4 GB LPDDR4",
      storage: "32 GB eMMC (64 GB OLED)",
      output: "Up to 1080p docked · 720p handheld",
      launched: "2017-03-03",
    },
    blurb: "The hybrid that redefined portable play.",
  },
  {
    id: "switch-2",
    slug: "switch-2",
    name: "Nintendo Switch 2",
    short: "Switch 2",
    family: "nintendo",
    chart: "#FF7A85",
    power: 0.36,
    outputHeight: 2160,
    hardware: {
      cpu: "Custom NVIDIA processor · 8× ARM Cortex-A78C",
      gpu: "NVIDIA Ampere · 1536 CUDA cores · DLSS",
      memory: "12 GB LPDDR5X",
      storage: "256 GB UFS",
      output: "Up to 4K docked · 1080p 120 Hz handheld · HDR · VRR (handheld)",
      launched: "2025-06-05",
    },
    blurb: "Nintendo's successor hybrid with DLSS-class upscaling.",
  },
  {
    id: "steam-deck",
    slug: "steam-deck",
    name: "Steam Deck",
    short: "Steam Deck",
    family: "steamdeck",
    chart: "#1A9FFF",
    power: 0.2,
    outputHeight: 800,
    hardware: {
      cpu: "AMD Zen 2 · 4 cores / 8 threads",
      gpu: "AMD RDNA 2 · 8 CUs · 1.6 TFLOPS",
      memory: "16 GB LPDDR5",
      storage: "64 GB eMMC – 1 TB NVMe",
      output: "1280×800 · 60 Hz (LCD) / 90 Hz HDR (OLED)",
      launched: "2022-02-25",
    },
    blurb: "Valve's handheld PC, measured on its default SteamOS profile.",
  },
  {
    id: "pc-mid",
    slug: "pc-mid",
    name: "PC · Mid (RTX 4060 · Ryzen 5 7600)",
    short: "PC Mid",
    family: "pc",
    chart: "#8C94A3",
    power: 1.15,
    outputHeight: 1080,
    hardware: {
      cpu: "AMD Ryzen 5 7600 · 6C/12T",
      gpu: "NVIDIA GeForce RTX 4060 · 8 GB",
      memory: "32 GB DDR5-6000",
      storage: "1 TB PCIe 4.0 NVMe",
      output: "1080p reference preset",
    },
    blurb: "A mainstream 1080p gaming PC reference build.",
  },
  {
    id: "pc-high",
    slug: "pc-high",
    name: "PC · High (RTX 4080 Super · Ryzen 7 7800X3D)",
    short: "PC High",
    family: "pc",
    chart: "#1B1F27",
    power: 2.9,
    outputHeight: 2160,
    hardware: {
      cpu: "AMD Ryzen 7 7800X3D · 8C/16T",
      gpu: "NVIDIA GeForce RTX 4080 Super · 16 GB",
      memory: "32 GB DDR5-6000",
      storage: "2 TB PCIe 4.0 NVMe",
      output: "4K reference preset",
    },
    blurb: "An enthusiast 4K reference build.",
  },
];

export const platformById = Object.fromEntries(platforms.map((p) => [p.id, p])) as Record<
  PlatformId,
  PlatformDef
>;

export function themeFor(id: PlatformId): FamilyTheme {
  return families[platformById[id].family];
}

export const releasePlatformMeta: Record<ReleasePlatform, { label: string; family: PlatformFamily }> = {
  ps4: { label: "PS4", family: "playstation" },
  ps5: { label: "PS5", family: "playstation" },
  "xbox-one": { label: "Xbox One", family: "xbox" },
  "xbox-series": { label: "Xbox Series X|S", family: "xbox" },
  switch: { label: "Switch", family: "nintendo" },
  "switch-2": { label: "Switch 2", family: "nintendo" },
  pc: { label: "PC", family: "pc" },
  mac: { label: "Mac", family: "pc" },
};

/** Platform pages group by family. */
export const familyOrder: PlatformFamily[] = ["playstation", "xbox", "nintendo", "pc", "steamdeck"];

export const modeLabels: Record<string, string> = {
  performance: "Performance",
  balanced: "Balanced",
  quality: "Quality",
  raytracing: "Ray Tracing",
};
