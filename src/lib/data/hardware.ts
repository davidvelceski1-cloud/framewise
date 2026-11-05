/**
 * Relative performance indices used by the "Can I run it?" estimator.
 * GPU index: RTX 3060 = 100 (approximate 1080p/1440p raster throughput).
 * CPU index: Ryzen 5 3600 = 100 (approximate gaming throughput).
 * These are coarse, editorial estimates — the UI always reports a confidence level.
 */
export interface GpuEntry {
  name: string;
  score: number;
  vram: number;
  rt: boolean;
  vendor: "NVIDIA" | "AMD" | "Intel" | "Other";
}
export interface CpuEntry {
  name: string;
  score: number;
  vendor: "Intel" | "AMD";
}

const g = (name: string, score: number, vram: number, rt: boolean, vendor: GpuEntry["vendor"]): GpuEntry => ({ name, score, vram, rt, vendor });

export const gpus: GpuEntry[] = [
  g("GeForce 9800 GTX+", 8, 1, false, "NVIDIA"),
  g("GTX 770", 30, 2, false, "NVIDIA"),
  g("GTX 960", 28, 4, false, "NVIDIA"),
  g("GTX 970", 40, 4, false, "NVIDIA"),
  g("GTX 1050 Ti", 25, 4, false, "NVIDIA"),
  g("GTX 1060 3GB", 45, 3, false, "NVIDIA"),
  g("GTX 1060 6GB", 50, 6, false, "NVIDIA"),
  g("GTX 1070", 63, 8, false, "NVIDIA"),
  g("GTX 1070 Ti", 70, 8, false, "NVIDIA"),
  g("GTX 1080", 76, 8, false, "NVIDIA"),
  g("GTX 1080 Ti", 98, 11, false, "NVIDIA"),
  g("GTX 1650", 38, 4, false, "NVIDIA"),
  g("GTX 1660 Super", 62, 6, false, "NVIDIA"),
  g("RTX 2060", 80, 6, true, "NVIDIA"),
  g("RTX 2060 Super", 92, 8, true, "NVIDIA"),
  g("RTX 2070", 95, 8, true, "NVIDIA"),
  g("RTX 2070 Super", 105, 8, true, "NVIDIA"),
  g("RTX 2080", 112, 8, true, "NVIDIA"),
  g("RTX 2080 Ti", 140, 11, true, "NVIDIA"),
  g("RTX 3050", 65, 8, true, "NVIDIA"),
  g("RTX 3060", 100, 12, true, "NVIDIA"),
  g("RTX 3060 Ti", 125, 8, true, "NVIDIA"),
  g("RTX 3070", 140, 8, true, "NVIDIA"),
  g("RTX 3070 Ti", 150, 8, true, "NVIDIA"),
  g("RTX 3080", 175, 10, true, "NVIDIA"),
  g("RTX 3080 Ti", 195, 12, true, "NVIDIA"),
  g("RTX 3090", 200, 24, true, "NVIDIA"),
  g("RTX 4060", 112, 8, true, "NVIDIA"),
  g("RTX 4060 Ti", 135, 8, true, "NVIDIA"),
  g("RTX 4070", 170, 12, true, "NVIDIA"),
  g("RTX 4070 Super", 195, 12, true, "NVIDIA"),
  g("RTX 4070 Ti", 210, 12, true, "NVIDIA"),
  g("RTX 4080", 260, 16, true, "NVIDIA"),
  g("RTX 4080 Super", 265, 16, true, "NVIDIA"),
  g("RTX 4090", 340, 24, true, "NVIDIA"),
  g("RTX 5060", 135, 8, true, "NVIDIA"),
  g("RTX 5060 Ti", 150, 16, true, "NVIDIA"),
  g("RTX 5070", 210, 12, true, "NVIDIA"),
  g("RTX 5070 Ti", 260, 16, true, "NVIDIA"),
  g("RTX 5080", 295, 16, true, "NVIDIA"),
  g("RTX 5090", 430, 32, true, "NVIDIA"),
  g("R9 280", 32, 3, false, "AMD"),
  g("R9 290", 45, 4, false, "AMD"),
  g("RX 470", 42, 4, false, "AMD"),
  g("RX 480", 47, 8, false, "AMD"),
  g("RX 580", 50, 8, false, "AMD"),
  g("RX 590", 54, 8, false, "AMD"),
  g("RX Vega 56", 70, 8, false, "AMD"),
  g("RX 5500 XT", 52, 8, false, "AMD"),
  g("RX 5700", 88, 8, false, "AMD"),
  g("RX 5700 XT", 98, 8, false, "AMD"),
  g("RX 6600", 95, 8, true, "AMD"),
  g("RX 6600 XT", 110, 8, true, "AMD"),
  g("RX 6650 XT", 115, 8, true, "AMD"),
  g("RX 6700 XT", 135, 12, true, "AMD"),
  g("RX 6750 XT", 140, 12, true, "AMD"),
  g("RX 6800", 170, 16, true, "AMD"),
  g("RX 6800 XT", 195, 16, true, "AMD"),
  g("RX 6900 XT", 210, 16, true, "AMD"),
  g("RX 7600", 112, 8, true, "AMD"),
  g("RX 7700 XT", 165, 12, true, "AMD"),
  g("RX 7800 XT", 195, 16, true, "AMD"),
  g("RX 7900 GRE", 215, 16, true, "AMD"),
  g("RX 7900 XT", 255, 20, true, "AMD"),
  g("RX 7900 XTX", 295, 24, true, "AMD"),
  g("RX 9070", 245, 16, true, "AMD"),
  g("RX 9070 XT", 275, 16, true, "AMD"),
  g("Arc A380", 40, 6, true, "Intel"),
  g("Arc A580", 90, 8, true, "Intel"),
  g("Arc A750", 100, 8, true, "Intel"),
  g("Arc A770", 108, 16, true, "Intel"),
  g("Arc B580", 120, 12, true, "Intel"),
];

const c = (name: string, score: number, vendor: CpuEntry["vendor"]): CpuEntry => ({ name, score, vendor });

export const cpus: CpuEntry[] = [
  c("Core 2 Duo E5200", 15, "Intel"),
  c("Core i5-2500K", 55, "Intel"),
  c("Core i7-3770", 62, "Intel"),
  c("Core i5-4460", 62, "Intel"),
  c("Core i5-4670K", 66, "Intel"),
  c("Core i5-4690", 68, "Intel"),
  c("Core i7-4770K", 72, "Intel"),
  c("Core i5-6600", 75, "Intel"),
  c("Core i7-6700", 82, "Intel"),
  c("Core i7-6800K", 84, "Intel"),
  c("Core i5-7600K", 85, "Intel"),
  c("Core i3-8100", 72, "Intel"),
  c("Core i5-8400", 88, "Intel"),
  c("Core i5-8600", 92, "Intel"),
  c("Core i7-8700", 98, "Intel"),
  c("Core i7-8700K", 102, "Intel"),
  c("Core i7-9700", 108, "Intel"),
  c("Core i5-10400", 100, "Intel"),
  c("Core i5-10600K", 112, "Intel"),
  c("Core i7-10700K", 118, "Intel"),
  c("Core i5-11600K", 120, "Intel"),
  c("Core i3-12100", 115, "Intel"),
  c("Core i5-12400", 128, "Intel"),
  c("Core i5-12600K", 140, "Intel"),
  c("Core i7-12700", 148, "Intel"),
  c("Core i7-12700K", 152, "Intel"),
  c("Core i5-13600K", 165, "Intel"),
  c("Core i7-13700K", 175, "Intel"),
  c("Core i7-14700K", 180, "Intel"),
  c("Core i9-13900K", 190, "Intel"),
  c("Core i9-14900K", 195, "Intel"),
  c("Core Ultra 7 265K", 185, "Intel"),
  c("Phenom II X4 940", 35, "AMD"),
  c("FX-6300", 45, "AMD"),
  c("FX-8350", 52, "AMD"),
  c("Ryzen 3 1200", 60, "AMD"),
  c("Ryzen 5 1400", 64, "AMD"),
  c("Ryzen 5 1500X", 68, "AMD"),
  c("Ryzen 5 1600", 72, "AMD"),
  c("Ryzen 5 2600", 80, "AMD"),
  c("Ryzen 5 2600X", 84, "AMD"),
  c("Ryzen 3 3100", 88, "AMD"),
  c("Ryzen 3 3300X", 96, "AMD"),
  c("Ryzen 5 3600", 100, "AMD"),
  c("Ryzen 5 3600X", 104, "AMD"),
  c("Ryzen 7 3700X", 106, "AMD"),
  c("Ryzen 5 5500", 112, "AMD"),
  c("Ryzen 5 5600", 130, "AMD"),
  c("Ryzen 5 5600X", 133, "AMD"),
  c("Ryzen 7 5700X", 138, "AMD"),
  c("Ryzen 7 5800X3D", 165, "AMD"),
  c("Ryzen 5 7600", 160, "AMD"),
  c("Ryzen 7 7700", 168, "AMD"),
  c("Ryzen 7 7800X3D", 200, "AMD"),
  c("Ryzen 9 7950X", 185, "AMD"),
  c("Ryzen 7 9800X3D", 220, "AMD"),
];

const norm = (s: string) => s.toLowerCase().replace(/geforce|radeon|nvidia|amd|intel|core|\s|-/g, "");

export function findGpu(query: string): GpuEntry | undefined {
  const q = norm(query);
  if (!q) return undefined;
  // longest name first so "RTX 3060 Ti" wins over "RTX 3060"
  const exact = [...gpus].sort((a, b) => b.name.length - a.name.length).find((x) => q.includes(norm(x.name)));
  if (exact) return exact;
  // "GTX 1060" without a memory suffix: pick the strongest variant, but never let "1060" match "1060 Ti"
  return gpus
    .filter((x) => /\d+GB$/.test(x.name))
    .filter((x) => {
      const base = norm(x.name.replace(/\s*\d+GB$/, ""));
      const i = q.indexOf(base);
      return i >= 0 && !q.slice(i + base.length).startsWith("ti");
    })
    .sort((a, b) => b.score - a.score)[0];
}

export function findCpu(query: string): CpuEntry | undefined {
  const q = norm(query);
  if (!q) return undefined;
  return [...cpus].sort((a, b) => b.name.length - a.name.length).find((x) => q.includes(norm(x.name)));
}

export function gpuByName(name: string) {
  return gpus.find((x) => x.name === name);
}
export function cpuByName(name: string) {
  return cpus.find((x) => x.name === name);
}
