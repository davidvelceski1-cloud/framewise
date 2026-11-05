import type { PcRequirements, ReqTier } from "../types";

const SRC = "Publisher store listing (seeded — verify before production)";
const W = "Windows 10/11 64-bit";

const t = (cpu: string, gpu: string, ram: number, vram: number, storage: string, api: string, target: string, os = W): ReqTier => ({
  cpu, gpu, ram, vram, storage, os, api, target,
});

export const requirements: PcRequirements[] = [
  {
    gameSlug: "cyberpunk-2077",
    minimum: t("Core i7-6700 / Ryzen 5 1600", "GTX 1060 6GB / RX 580 8GB / Arc A380", 12, 6, "70 GB SSD", "DirectX 12", "1080p · Low · 30 fps"),
    recommended: t("Core i7-12700 / Ryzen 7 7800X3D", "RTX 2060 Super / RX 5700 XT / Arc A770", 16, 8, "70 GB SSD", "DirectX 12", "1080p · High · 60 fps"),
    ultra: t("Core i7-12700 / Ryzen 7 7800X3D", "RTX 3080 / RX 7900 XTX", 20, 10, "70 GB NVMe SSD", "DirectX 12", "2160p · Ultra · 60 fps (upscaled)"),
    refs: { minGpu: "GTX 1060 6GB", recGpu: "RTX 2060 Super", minCpu: "Core i7-6700", recCpu: "Core i7-12700" },
    source: SRC,
  },
  {
    gameSlug: "elden-ring",
    minimum: t("Core i5-8400 / Ryzen 3 3300X", "GTX 1060 3GB / RX 580 4GB", 12, 3, "60 GB", "DirectX 12", "1080p · Low · 30 fps"),
    recommended: t("Core i7-8700K / Ryzen 5 3600X", "GTX 1070 8GB / RX Vega 56", 16, 8, "60 GB", "DirectX 12", "1080p · High · 60 fps"),
    refs: { minGpu: "GTX 1060 3GB", recGpu: "GTX 1070", minCpu: "Core i5-8400", recCpu: "Core i7-8700K" },
    source: SRC,
  },
  {
    gameSlug: "baldurs-gate-3",
    minimum: t("Core i5-4690 / FX-8350", "GTX 970 / RX 480", 8, 4, "150 GB SSD", "DirectX 11 / Vulkan", "1080p · Low · 30 fps"),
    recommended: t("Core i7-8700K / Ryzen 5 3600", "RTX 2060 Super / RX 5700 XT", 16, 8, "150 GB SSD", "DirectX 11 / Vulkan", "1080p · High · 60 fps"),
    refs: { minGpu: "GTX 970", recGpu: "RTX 2060 Super", minCpu: "Core i5-4690", recCpu: "Core i7-8700K" },
    source: SRC,
  },
  {
    gameSlug: "alan-wake-2",
    minimum: t("Core i5-7600K / Ryzen 5 2600", "RTX 2060 / RX 6600", 16, 6, "90 GB SSD", "DirectX 12 Ultimate", "1080p · Low · 30 fps (DLSS/FSR Quality)"),
    recommended: t("Ryzen 7 3700X", "RTX 3070 / RX 6700 XT", 16, 8, "90 GB SSD", "DirectX 12 Ultimate", "1080p · Medium · 60 fps (DLSS/FSR Quality)"),
    ultra: t("Ryzen 7 3700X", "RTX 4080", 16, 16, "90 GB SSD", "DirectX 12 Ultimate", "2160p · Path tracing · 60 fps (DLSS + FG)"),
    refs: { minGpu: "RTX 2060", recGpu: "RTX 3070", minCpu: "Core i5-7600K", recCpu: "Ryzen 7 3700X" },
    source: SRC,
  },
  {
    gameSlug: "red-dead-redemption-2",
    minimum: t("Core i5-2500K / FX-6300", "GTX 770 2GB / R9 280 3GB", 8, 2, "150 GB", "DirectX 12 / Vulkan", "1080p · Low · 30 fps"),
    recommended: t("Core i7-4770K / Ryzen 5 1500X", "GTX 1060 6GB / RX 480 4GB", 12, 6, "150 GB", "DirectX 12 / Vulkan", "1080p · High · 60 fps"),
    refs: { minGpu: "GTX 770", recGpu: "GTX 1060 6GB", minCpu: "Core i5-2500K", recCpu: "Core i7-4770K" },
    source: SRC,
  },
  {
    gameSlug: "god-of-war-ragnarok",
    minimum: t("Core i5-4670K / Ryzen 3 1200", "GTX 1060 6GB / RX 5500 XT", 8, 6, "190 GB SSD", "DirectX 12", "1080p · Low · 30 fps"),
    recommended: t("Core i5-8600 / Ryzen 5 3600", "RTX 3060 / RX 5700", 16, 8, "190 GB SSD", "DirectX 12", "1080p · High · 60 fps"),
    ultra: t("Core i7-12700K / Ryzen 7 5700X", "RTX 4070 / RX 7700 XT", 32, 12, "190 GB SSD", "DirectX 12", "2160p · Ultra · 60 fps (upscaled)"),
    refs: { minGpu: "GTX 1060 6GB", recGpu: "RTX 3060", minCpu: "Core i5-4670K", recCpu: "Core i5-8600" },
    source: SRC,
  },
  {
    gameSlug: "forza-horizon-5",
    minimum: t("Core i5-4460 / Ryzen 3 1200", "GTX 970 / RX 470", 8, 4, "110 GB", "DirectX 12", "1080p · Low · 30 fps"),
    recommended: t("Core i5-8400 / Ryzen 5 1500X", "GTX 1070 / RX 590", 16, 8, "110 GB", "DirectX 12", "1080p · High · 60 fps"),
    refs: { minGpu: "GTX 970", recGpu: "GTX 1070", minCpu: "Core i5-4460", recCpu: "Core i5-8400" },
    source: SRC,
  },
  {
    gameSlug: "black-myth-wukong",
    minimum: t("Core i5-8400 / Ryzen 5 1600", "GTX 1060 6GB / RX 580 8GB", 16, 6, "130 GB SSD", "DirectX 12", "1080p · Low · 30 fps"),
    recommended: t("Core i7-9700 / Ryzen 5 5500", "RTX 2060 / RX 5700 XT / Arc A750", 16, 6, "130 GB SSD", "DirectX 12", "1080p · High · 60 fps (upscaled)"),
    refs: { minGpu: "GTX 1060 6GB", recGpu: "RTX 2060", minCpu: "Core i5-8400", recCpu: "Core i7-9700" },
    source: SRC,
  },
  {
    gameSlug: "marvels-spider-man-2",
    minimum: t("Core i3-8100 / Ryzen 3 3100", "GTX 1650 / RX 5500 XT", 16, 4, "150 GB SSD", "DirectX 12", "720p · Very Low · 30 fps"),
    recommended: t("Core i5-8400 / Ryzen 5 3600", "RTX 3060 / RX 6600 XT", 16, 8, "150 GB SSD", "DirectX 12", "1080p · High · 60 fps"),
    ultra: t("Core i7-12700K / Ryzen 7 7700", "RTX 4080 / RX 7900 XT", 32, 16, "150 GB NVMe SSD", "DirectX 12", "2160p · Very High + RT · 60 fps"),
    refs: { minGpu: "GTX 1650", recGpu: "RTX 3060", minCpu: "Core i3-8100", recCpu: "Core i5-8400" },
    source: SRC,
  },
  {
    gameSlug: "hogwarts-legacy",
    minimum: t("Core i5-6600 / Ryzen 5 1400", "GTX 960 4GB / RX 470 4GB", 16, 4, "85 GB SSD", "DirectX 12", "720p · Low · 30 fps"),
    recommended: t("Core i7-8700 / Ryzen 5 3600", "GTX 1080 Ti / RX 5700 XT / Arc A770", 16, 8, "85 GB SSD", "DirectX 12", "1080p · High · 60 fps"),
    refs: { minGpu: "GTX 960", recGpu: "GTX 1080 Ti", minCpu: "Core i5-6600", recCpu: "Core i7-8700" },
    source: SRC,
  },
  {
    gameSlug: "indiana-jones-and-the-great-circle",
    minimum: t("Core i7-10700K / Ryzen 7 3700X", "RTX 2060 Super 8GB / RX 6600 8GB / Arc A580", 16, 8, "120 GB SSD", "Vulkan (RT required)", "1080p · Low · 60 fps"),
    recommended: t("Core i7-12700K / Ryzen 7 7700", "RTX 3080 Ti 12GB / RX 7700 XT 12GB", 32, 12, "120 GB SSD", "Vulkan (RT required)", "1440p · High · 60 fps"),
    ultra: t("Core i7-12700K / Ryzen 7 7700", "RTX 4080 16GB / RX 7900 XT 20GB", 32, 16, "120 GB SSD", "Vulkan (RT required)", "2160p · Ultra · 60 fps (DLSS)"),
    refs: { minGpu: "RTX 2060 Super", recGpu: "RTX 3080 Ti", minCpu: "Core i7-10700K", recCpu: "Core i7-12700K" },
    source: SRC,
  },
  {
    gameSlug: "doom-the-dark-ages",
    minimum: t("Ryzen 7 3700X / Core i7-10700K", "RTX 2060 Super 8GB / RX 6600 8GB", 16, 8, "100 GB SSD", "Vulkan (RT required)", "1080p · Low · 60 fps"),
    recommended: t("Ryzen 7 5700X / Core i7-12700K", "RTX 3080 10GB / RX 6800 16GB", 32, 10, "100 GB SSD", "Vulkan (RT required)", "1440p · High · 60 fps"),
    refs: { minGpu: "RTX 2060 Super", recGpu: "RTX 3080", minCpu: "Ryzen 7 3700X", recCpu: "Ryzen 7 5700X" },
    source: SRC,
  },
  {
    gameSlug: "monster-hunter-wilds",
    minimum: t("Core i5-10400 / Ryzen 5 3600", "GTX 1660 Super / RX 5500 XT", 16, 6, "75 GB SSD", "DirectX 12", "1080p (upscaled from 720p) · Lowest · 30 fps"),
    recommended: t("Core i5-11600K / Ryzen 5 3600X", "RTX 2070 Super / RX 6700 XT", 16, 8, "75 GB SSD", "DirectX 12", "1080p (upscaled) · Medium · 60 fps with frame generation"),
    refs: { minGpu: "GTX 1660 Super", recGpu: "RTX 2070 Super", minCpu: "Core i5-10400", recCpu: "Core i5-11600K" },
    source: SRC,
  },
  {
    gameSlug: "the-witcher-3",
    minimum: t("Core i5-2500K / Phenom II X4 940", "GTX 770 / R9 290", 8, 2, "50 GB", "DirectX 11 / 12", "1080p · Low · 30 fps"),
    recommended: t("Core i7-3770 / FX-8350", "GTX 1070 / RX 480", 8, 8, "50 GB", "DirectX 12", "1080p · High · 60 fps"),
    ultra: t("Core i7-12700K / Ryzen 7 5700X", "RTX 3080 / RX 6800 XT", 16, 10, "50 GB SSD", "DirectX 12", "2160p · RT Ultra · 60 fps (upscaled)"),
    refs: { minGpu: "GTX 770", recGpu: "GTX 1070", minCpu: "Core i5-2500K", recCpu: "Core i7-3770" },
    source: SRC,
  },
  {
    gameSlug: "hollow-knight-silksong",
    minimum: t("Core 2 Duo E5200", "GeForce 9800 GTX+ (1 GB)", 4, 1, "8 GB", "DirectX 10", "1080p · 60 fps"),
    recommended: t("Core i5-4460", "GTX 960", 8, 2, "8 GB", "DirectX 11", "1080p · 60 fps"),
    refs: { minGpu: "GeForce 9800 GTX+", recGpu: "GTX 960", minCpu: "Core 2 Duo E5200", recCpu: "Core i5-4460" },
    source: SRC,
  },
  {
    gameSlug: "starfield",
    minimum: t("Ryzen 5 2600X / Core i7-6800K", "RX 5700 / GTX 1070 Ti", 16, 8, "125 GB SSD", "DirectX 12", "1080p · Low · 30 fps"),
    recommended: t("Ryzen 5 3600X / Core i5-10600K", "RX 6800 XT / RTX 2080", 16, 8, "125 GB SSD", "DirectX 12", "1440p · High · 60 fps"),
    refs: { minGpu: "GTX 1070 Ti", recGpu: "RTX 2080", minCpu: "Ryzen 5 2600X", recCpu: "Ryzen 5 3600X" },
    source: SRC,
  },
];
